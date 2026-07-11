import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface AgentExecutionAttributes {
  id: string;
  projectId: string;
  agentName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  input?: object | null;
  output?: object | null;
  logs?: string | null;
  durationMs?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AgentExecutionCreationAttributes = Optional<AgentExecutionAttributes, 'id' | 'input' | 'output' | 'logs' | 'durationMs' | 'status'>;

export class AgentExecution extends Model<AgentExecutionAttributes, AgentExecutionCreationAttributes> implements AgentExecutionAttributes {
  declare id: string;
  declare projectId: string;
  declare agentName: string;
  declare status: 'queued' | 'running' | 'completed' | 'failed';
  declare input: object | null;
  declare output: object | null;
  declare logs: string | null;
  declare durationMs: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AgentExecution.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    agentName: { type: DataTypes.STRING(100), allowNull: false },
    status: {
      type: DataTypes.ENUM('queued', 'running', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'queued',
    },
    input: { type: DataTypes.JSON, allowNull: true },
    output: { type: DataTypes.JSON, allowNull: true },
    logs: { type: DataTypes.TEXT, allowNull: true },
    durationMs: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'AgentExecution', tableName: 'agent_executions', timestamps: true }
);

export default AgentExecution;
