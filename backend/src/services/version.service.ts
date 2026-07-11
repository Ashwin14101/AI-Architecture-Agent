import { ArchitectureVersion } from '../models/architecture-version.model';
import { Project } from '../models/project.model';
import { auditService } from './audit.service';
import logger from '../utils/logger';

export const versionService = {
  async listVersions(projectId: string): Promise<ArchitectureVersion[]> {
    return ArchitectureVersion.findAll({
      where: { projectId },
      attributes: ['id', 'projectId', 'versionNumber', 'label', 'isCurrent', 'createdAt', 'updatedAt'],
      order: [['versionNumber', 'DESC']],
    });
  },

  async getVersion(projectId: string, versionId: string): Promise<ArchitectureVersion> {
    const version = await ArchitectureVersion.findOne({ where: { id: versionId, projectId } });
    if (!version) throw Object.assign(new Error('Version not found'), { status: 404 });
    return version;
  },

  async compareVersions(projectId: string, fromId: string, toId: string): Promise<object> {
    const [fromVersion, toVersion] = await Promise.all([
      this.getVersion(projectId, fromId),
      this.getVersion(projectId, toId),
    ]);

    const fromData = fromVersion.architectureData as Record<string, unknown>;
    const toData = toVersion.architectureData as Record<string, unknown>;

    // Simple structural diff
    const fromComponents = ((fromData.components as any[]) || []).map((c: any) => c.name);
    const toComponents = ((toData.components as any[]) || []).map((c: any) => c.name);

    const added = toComponents.filter((c) => !fromComponents.includes(c));
    const removed = fromComponents.filter((c) => !toComponents.includes(c));
    const unchanged = fromComponents.filter((c) => toComponents.includes(c));

    return {
      from: { id: fromVersion.id, versionNumber: fromVersion.versionNumber, label: fromVersion.label, createdAt: fromVersion.createdAt },
      to: { id: toVersion.id, versionNumber: toVersion.versionNumber, label: toVersion.label, createdAt: toVersion.createdAt },
      diff: {
        components: { added, removed, unchanged },
        terraformChanged: fromVersion.terraformCode !== toVersion.terraformCode,
        databaseSchemaChanged: JSON.stringify(fromVersion.databaseSchema) !== JSON.stringify(toVersion.databaseSchema),
        apiSpecChanged: JSON.stringify(fromVersion.apiSpec) !== JSON.stringify(toVersion.apiSpec),
      },
      summary: `${added.length} components added, ${removed.length} removed, ${unchanged.length} unchanged`,
    };
  },

  async rollback(projectId: string, versionId: string, userId: string): Promise<ArchitectureVersion> {
    const version = await ArchitectureVersion.findOne({ where: { id: versionId, projectId } });
    if (!version) throw Object.assign(new Error('Version not found'), { status: 404 });

    await ArchitectureVersion.update({ isCurrent: false }, { where: { projectId } });
    await version.update({ isCurrent: true });

    await Project.update({ status: 'ready' }, { where: { id: projectId } });
    await auditService.log(userId, 'architecture.rollback', 'ArchitectureVersion', versionId, { projectId });

    logger.info(`Rolled back project ${projectId} to version ${version.versionNumber}`);
    return version;
  },
};
