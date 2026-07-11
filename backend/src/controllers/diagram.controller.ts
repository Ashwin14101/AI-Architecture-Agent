import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ArchitectureVersion } from '../models/architecture-version.model';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);
const DIAGRAM_TYPES = ['system-context', 'component', 'database-erd', 'cloud-infrastructure', 'sequence'];

export const diagramController = {
  async getDiagram(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = p(req.params['type']);
      const projectId = p(req.params['id']);

      if (!DIAGRAM_TYPES.includes(type)) {
        res.status(400).json({ error: `Invalid diagram type. Valid types: ${DIAGRAM_TYPES.join(', ')}` });
        return;
      }

      const version = await ArchitectureVersion.findOne({ where: { projectId, isCurrent: true } });
      if (!version) { res.status(404).json({ error: 'No architecture available to generate diagram' }); return; }

      const arch = version.architectureData as Record<string, unknown>;
      const components = (arch.components as any[]) || [];
      const connections = (arch.connections as any[]) || [];

      let diagramData: object;

      if (type === 'system-context') {
        diagramData = {
          type: 'system-context',
          title: `${arch.name} - System Context`,
          actors: [{ id: 'user', name: 'End User', type: 'person' }],
          system: { id: 'system', name: arch.name, description: 'AI-generated architecture system' },
          relationships: [{ from: 'user', to: 'system', label: 'Uses' }],
        };
      } else if (type === 'component') {
        diagramData = {
          type: 'component',
          title: `${arch.name} - Component Diagram`,
          components: components.map((c: any) => ({ ...c, shape: 'rectangle' })),
          connections: connections.map((c: any) => ({ ...c, arrow: 'solid' })),
        };
      } else if (type === 'database-erd') {
        diagramData = { type: 'database-erd', title: `${arch.name} - Database ERD`, schema: version.databaseSchema };
      } else if (type === 'cloud-infrastructure') {
        diagramData = { type: 'cloud-infrastructure', title: `${arch.name} - Cloud Infrastructure`, cloudMapping: version.cloudMapping };
      } else {
        diagramData = {
          type: 'sequence',
          title: `${arch.name} - Request Flow`,
          participants: components.slice(0, 4).map((c: any) => ({ actor: c.name })),
          messages: [
            { from: 'End User', to: components[0]?.name || 'API', label: 'HTTP Request' },
            { from: components[0]?.name || 'API', to: components[1]?.name || 'Service', label: 'Process' },
            { from: components[1]?.name || 'Service', to: components[2]?.name || 'DB', label: 'Query' },
          ],
        };
      }

      res.status(200).json({
        diagramType: type, projectId, versionId: version.id,
        diagram: diagramData, generatedAt: new Date().toISOString(),
        note: 'Use this JSON with a diagram renderer like Mermaid, PlantUML, or D3.js',
      });
    } catch (err) { next(err); }
  },
};
