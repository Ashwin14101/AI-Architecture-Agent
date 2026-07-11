import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface AuditLogAttributes {
  id: string;
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: object | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

export type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id' | 'userId' | 'resourceType' | 'resourceId' | 'details' | 'ipAddress' | 'userAgent'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare userId: string | null;
  declare action: string;
  declare resourceType: string | null;
  declare resourceId: string | null;
  declare details: object | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    action: { type: DataTypes.STRING(200), allowNull: false },
    resourceType: { type: DataTypes.STRING(100), allowNull: true },
    resourceId: { type: DataTypes.UUID, allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true },
    ipAddress: { type: DataTypes.STRING(50), allowNull: true },
    userAgent: { type: DataTypes.STRING(500), allowNull: true },
  },
  { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', timestamps: true, updatedAt: false }
);

export default AuditLog;
