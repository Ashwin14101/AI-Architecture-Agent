import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { createWebSocketServer } from './websocket/websocket.server';
import sequelize from './models/index';
import logger from './utils/logger';

// Import all models so Sequelize registers them before sync
import './models/user.model';
import './models/organization.model';
import './models/project.model';
import './models/document.model';
import './models/requirement.model';
import './models/architecture-version.model';
import './models/review.model';
import './models/review-finding.model';
import './models/deployment.model';
import './models/conversation.model';
import './models/message.model';
import './models/knowledge.model';
import './models/agent-execution.model';
import './models/audit-log.model';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap(): Promise<void> {
  try {
    // ── Database sync ───────────────────────────────────────
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync all models (alter: true updates tables without dropping data)
    await sequelize.sync({ alter: true });
    logger.info('Database schema synchronised');

    // ── HTTP Server ─────────────────────────────────────────
    const app = createApp();
    const server = http.createServer(app);

    // ── WebSocket Server ────────────────────────────────────
    createWebSocketServer(server);

    // ── Start listening ─────────────────────────────────────
    server.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════');
      logger.info('  AI Architecture Generation Agent — Backend API');
      logger.info(`  HTTP  : http://localhost:${PORT}/api`);
      logger.info(`  WS    : ws://localhost:${PORT}/ws?projectId=<id>`);
      logger.info(`  Health: http://localhost:${PORT}/api/health`);
      logger.info(`  Env   : ${process.env.NODE_ENV || 'development'}`);
      logger.info('═══════════════════════════════════════════════════');
    });

    // ── Graceful shutdown ───────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('Server and database connections closed');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => { logger.error('Forced exit after timeout'); process.exit(1); }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection:', { reason });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', { message: err.message, stack: err.stack });
      process.exit(1);
    });

  } catch (err) {
    logger.error('Failed to start server:', { err });
    process.exit(1);
  }
}

bootstrap();
