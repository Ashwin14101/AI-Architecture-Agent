import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { projectService } from '../services/project.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const projectController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.createProject(req.user!.userId, req.body);
      res.status(201).json(project);
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await projectService.listProjects(req.user!.userId);
      res.status(200).json({ projects, count: projects.length });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.getProject(p(req.params['id']), req.user!.userId);
      res.status(200).json(project);
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.updateProject(p(req.params['id']), req.user!.userId, req.body);
      res.status(200).json(project);
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectService.deleteProject(p(req.params['id']), req.user!.userId);
      res.status(200).json({ message: 'Project archived successfully' });
    } catch (err) { next(err); }
  },
};
