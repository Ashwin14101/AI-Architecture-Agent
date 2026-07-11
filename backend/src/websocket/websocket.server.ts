import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';
import { notificationService } from '../services/notification.service';
import logger from '../utils/logger';

export function createWebSocketServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    // Parse projectId from query string: /ws?projectId=<id>
    const parsedUrl = url.parse(req.url || '', true);
    const projectId = parsedUrl.query.projectId as string | undefined;

    if (!projectId) {
      ws.send(JSON.stringify({ event: 'error', message: 'projectId query parameter is required' }));
      ws.close(1008, 'Missing projectId');
      return;
    }

    // Register this client in the project room
    notificationService.registerClient(projectId, ws);

    // Send welcome event
    ws.send(JSON.stringify({
      event: 'connected',
      projectId,
      message: `Connected to project room ${projectId}`,
      timestamp: new Date().toISOString(),
    }));

    logger.info(`WebSocket client connected to project: ${projectId}  (total clients in room: ${wss.clients.size})`);

    // Handle incoming messages from client (e.g., ping / subscribe to extra events)
    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString()) as { type: string; payload?: unknown };

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
          return;
        }

        if (msg.type === 'subscribe') {
          ws.send(JSON.stringify({ event: 'subscribed', projectId, timestamp: new Date().toISOString() }));
          return;
        }

        logger.debug(`Unhandled WS message type: ${msg.type}`);
      } catch {
        ws.send(JSON.stringify({ event: 'error', message: 'Invalid JSON message' }));
      }
    });

    ws.on('close', () => {
      notificationService.removeClient(ws);
      logger.info(`WebSocket client disconnected from project: ${projectId}`);
    });

    ws.on('error', (err: Error) => {
      logger.error(`WebSocket error on project ${projectId}:`, { message: err.message });
      notificationService.removeClient(ws);
    });
  });

  wss.on('error', (err: Error) => {
    logger.error('WebSocket server error:', { message: err.message });
  });

  logger.info('WebSocket server initialised on path /ws');
  return wss;
}
