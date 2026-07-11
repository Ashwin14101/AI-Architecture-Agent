import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { generalRateLimit } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import apiRoutes from './routes/index';
import logger from './utils/logger';

export function createApp(): Application {
  const app = express();

  // ── CORS ─────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body parsers ─────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── General rate limiting ─────────────────────────────────
  app.use(generalRateLimit);

  // ── Request logger ────────────────────────────────────────
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info(`[${req.method}] ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    });
    next();
  });

  // ── Static uploads ────────────────────────────────────────
  app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

  // ── API routes ────────────────────────────────────────────
  app.use('/api', apiRoutes);

  // ── 404 + Error handlers ──────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
