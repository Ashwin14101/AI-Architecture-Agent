import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import cloudRoutes from './cloud.routes';

const router = Router();

// ── Health check (public) ─────────────────────────────────
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'AI Architecture Generation Agent API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ── Route groups ──────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/cloud', cloudRoutes);

export default router;
