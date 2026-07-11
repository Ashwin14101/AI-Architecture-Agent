import WebSocket from 'ws';
import logger from '../utils/logger';

// Map of projectId -> Set of WebSocket clients
const projectRooms = new Map<string, Set<WebSocket>>();
// Map of ws -> projectId
const clientProject = new Map<WebSocket, string>();

export const notificationService = {
  registerClient(projectId: string, ws: WebSocket): void {
    if (!projectRooms.has(projectId)) {
      projectRooms.set(projectId, new Set());
    }
    projectRooms.get(projectId)!.add(ws);
    clientProject.set(ws, projectId);
    logger.debug(`WS client joined project room: ${projectId}`);
  },

  removeClient(ws: WebSocket): void {
    const projectId = clientProject.get(ws);
    if (projectId) {
      projectRooms.get(projectId)?.delete(ws);
      clientProject.delete(ws);
      logger.debug(`WS client left project room: ${projectId}`);
    }
  },

  emit(projectId: string, event: string, payload: object): void {
    const room = projectRooms.get(projectId);
    if (!room || room.size === 0) return;

    const message = JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() });
    let sent = 0;
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sent++;
      }
    }
    if (sent > 0) {
      logger.debug(`WS emitted '${event}' to ${sent} clients in project ${projectId}`);
    }
  },

  emitGenerationProgress(projectId: string, step: string, progress: number, detail?: string): void {
    this.emit(projectId, 'generation-progress', {
      projectId,
      status: 'in-progress',
      step,
      progress,
      detail: detail || step,
    });
  },

  emitGenerationComplete(projectId: string, architectureId: string): void {
    this.emit(projectId, 'generation-complete', {
      projectId,
      architectureId,
      status: 'completed',
    });
  },

  emitReviewReady(projectId: string, reviewId: string, findingsCount: number): void {
    this.emit(projectId, 'review-ready', { projectId, reviewId, findings: findingsCount });
  },

  emitDeploymentStatus(projectId: string, deploymentId: string, status: string): void {
    this.emit(projectId, 'deployment-status', { projectId, deploymentId, status });
  },

  emitNewMessage(projectId: string, conversationId: string, message: string, sender: string): void {
    this.emit(projectId, 'new-message', { projectId, conversationId, message, sender });
  },
};
