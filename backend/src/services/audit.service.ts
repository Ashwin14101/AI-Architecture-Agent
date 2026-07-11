import { AuditLog } from '../models/audit-log.model';
import logger from '../utils/logger';

export const auditService = {
  async log(
    userId: string | null | undefined,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: object,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId: userId || undefined,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
      });
    } catch (err) {
      logger.error('Failed to write audit log', { action, err });
    }
  },

  async getAuditLogs(filters: { userId?: string; action?: string; resourceId?: string }, limit = 100): Promise<AuditLog[]> {
    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceId) where.resourceId = filters.resourceId;

    return AuditLog.findAll({ where, order: [['createdAt', 'DESC']], limit });
  },
};
