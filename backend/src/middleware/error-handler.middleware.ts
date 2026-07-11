import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  logger.error(`[${req.method}] ${req.path} → ${status}: ${message}`, {
    stack: status === 500 ? err.stack : undefined,
    body: req.body,
  });

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { stack: err.stack } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
