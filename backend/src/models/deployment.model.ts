import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface DeploymentAttributes {
  id: string;
  projectId: string;
  versionId: string;
  status: 'pending' | 'approved' | 'deploying' | 'deployed' | 'failed' | 'rolled-back';
  environment: 'staging' | 'production';
  approvedBy?: string | null;
  logOutput?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DeploymentCreationAttributes = Optional<DeploymentAttributes, 'id' | 'approvedBy' | 'logOutput' | 'errorMessage' | 'status' | 'environment'>;

export class Deployment extends Model<DeploymentAttributes, DeploymentCreationAttributes> implements DeploymentAttributes {
  declare id: string;
  declare projectId: string;
  declare versionId: string;
  declare status: 'pending' | 'approved' | 'deploying' | 'deployed' | 'failed' | 'rolled-back';
  declare environment: 'staging' | 'production';
  declare approvedBy: string | null;
  declare logOutput: string | null;
  declare errorMessage: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Deployment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    versionId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'deploying', 'deployed', 'failed', 'rolled-back'),
      allowNull: false,
      defaultValue: 'pending',
    },
    environment: {
      type: DataTypes.ENUM('staging', 'production'),
      allowNull: false,
      defaultValue: 'staging',
    },
    approvedBy: { type: DataTypes.UUID, allowNull: true },
    logOutput: { type: DataTypes.TEXT, allowNull: true },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Deployment', tableName: 'deployments', timestamps: true }
);

export default Deployment;
