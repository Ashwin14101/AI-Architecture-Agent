import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { deploymentService } from '../services/deployment.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const deploymentController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deployment = await deploymentService.createDeployment(p(req.params['id']), req.user!.userId, req.body.environment);
      res.status(201).json({ message: 'Deployment created, awaiting approval', deployment });
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deployments = await deploymentService.listDeployments(p(req.params['id']));
      res.status(200).json({ deployments, count: deployments.length });
    } catch (err) { next(err); }
  },

  async approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deployment = await deploymentService.approveDeployment(p(req.params['dId']), p(req.params['id']), req.user!.userId);
      res.status(200).json({ message: 'Deployment approved, executing...', deployment });
    } catch (err) { next(err); }
  },

  async rollback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deployment = await deploymentService.rollbackDeployment(p(req.params['dId']), p(req.params['id']), req.user!.userId);
      res.status(200).json({ message: 'Deployment rolled back', deployment });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deployment = await deploymentService.getDeployment(p(req.params['dId']), p(req.params['id']));
      res.status(200).json(deployment);
    } catch (err) { next(err); }
  },
};
