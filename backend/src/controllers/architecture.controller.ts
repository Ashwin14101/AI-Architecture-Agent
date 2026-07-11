import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { architectureService } from '../services/architecture.service';
import { projectService } from '../services/project.service';

export const architectureController = {
  async generate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectService.getProject(req.params['id'] as string, req.user!.userId);
      await architectureService.startGeneration(req.params['id'] as string, req.user!.userId);
      res.status(202).json({ message: 'Architecture generation started', projectId: req.params['id'] });
    } catch (err) { next(err); }
  },

  async getArchitecture(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await architectureService.getCurrentVersion(req.params['id'] as string);
      if (!version) { res.status(404).json({ error: 'No architecture generated yet' }); return; }
      res.status(200).json({
        versionId: version.id,
        versionNumber: version.versionNumber,
        label: version.label,
        architecture: version.architectureData,
        generatedAt: version.createdAt,
      });
    } catch (err) { next(err); }
  },

  async getDatabaseSchema(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await architectureService.getCurrentVersion(req.params['id'] as string);
      if (!version) { res.status(404).json({ error: 'No architecture generated yet' }); return; }
      res.status(200).json({ databaseSchema: version.databaseSchema, versionId: version.id });
    } catch (err) { next(err); }
  },

  async getApiSpec(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await architectureService.getCurrentVersion(req.params['id'] as string);
      if (!version) { res.status(404).json({ error: 'No architecture generated yet' }); return; }
      res.status(200).json({ apiSpec: version.apiSpec, versionId: version.id });
    } catch (err) { next(err); }
  },

  async getWorkflowStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await architectureService.getWorkflowStatus(req.params['id'] as string);
      res.status(200).json(status);
    } catch (err) { next(err); }
  },
};
