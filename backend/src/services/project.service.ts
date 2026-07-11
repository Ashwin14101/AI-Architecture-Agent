import { Project, ProjectCreationAttributes } from '../models/project.model';
import { User } from '../models/user.model';
import { auditService } from './audit.service';
import logger from '../utils/logger';

export const projectService = {
  async createProject(ownerId: string, data: Partial<ProjectCreationAttributes>): Promise<Project> {
    const project = await Project.create({
      name: data.name!,
      description: data.description,
      ownerId,
      organizationId: data.organizationId,
      settings: data.settings,
    });
    await auditService.log(ownerId, 'project.created', 'Project', project.id, { name: project.name });
    logger.info(`Project created: ${project.id} by user ${ownerId}`);
    return project;
  },

  async listProjects(userId: string): Promise<Project[]> {
    return Project.findAll({
      where: { ownerId: userId },
      order: [['createdAt', 'DESC']],
    });
  },

  async getProject(id: string, userId: string): Promise<Project> {
    const project = await Project.findOne({ where: { id, ownerId: userId } });
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
    return project;
  },

  async updateProject(id: string, userId: string, data: Partial<ProjectCreationAttributes>): Promise<Project> {
    const project = await this.getProject(id, userId);
    await project.update(data);
    await auditService.log(userId, 'project.updated', 'Project', id, data);
    return project;
  },

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.getProject(id, userId);
    await project.update({ status: 'archived' });
    await auditService.log(userId, 'project.archived', 'Project', id, {});
    logger.info(`Project archived: ${id}`);
  },

  async getProjectOwner(projectId: string): Promise<User | null> {
    const project = await Project.findByPk(projectId);
    if (!project) return null;
    return User.findByPk(project.ownerId);
  },
};
