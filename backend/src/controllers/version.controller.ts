import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { versionService } from '../services/version.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const versionController = {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = await versionService.listVersions(p(req.params['id']));
      res.status(200).json({ versions, count: versions.length });
    } catch (err) { next(err); }
  },

  async compare(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = p(req.query['from'] as string | string[]);
      const to = p(req.query['to'] as string | string[]);
      if (!from || !to) { res.status(400).json({ error: 'Query params from and to are required' }); return; }
      const diff = await versionService.compareVersions(p(req.params['id']), from, to);
      res.status(200).json(diff);
    } catch (err) { next(err); }
  },

  async rollback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await versionService.rollback(p(req.params['id']), p(req.params['vId']), req.user!.userId);
      res.status(200).json({ message: `Rolled back to version ${version.versionNumber}`, version });
    } catch (err) { next(err); }
  },
};
