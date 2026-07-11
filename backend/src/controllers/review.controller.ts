import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { reviewService } from '../services/review.service';

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const reviewController = {
  async requestReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.requestReview(p(req.params['id']), req.user!.userId);
      res.status(202).json({ message: 'AI review started', reviewId: review.id, status: review.status });
    } catch (err) { next(err); }
  },

  async getReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { review, findings } = await reviewService.getReview(p(req.params['rId']), p(req.params['id']));
      res.status(200).json({ review, findings });
    } catch (err) { next(err); }
  },

  async updateFinding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!['accepted', 'rejected'].includes(status)) {
        res.status(400).json({ error: "status must be 'accepted' or 'rejected'" });
        return;
      }
      const finding = await reviewService.updateFinding(p(req.params['rId']), p(req.params['fId']), status);
      res.status(200).json({ message: `Finding ${status}`, finding });
    } catch (err) { next(err); }
  },
};
