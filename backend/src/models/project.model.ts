import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface ProjectAttributes {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  organizationId?: string | null;
  status: 'active' | 'archived' | 'generating' | 'ready';
  settings?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectCreationAttributes = Optional<ProjectAttributes, 'id' | 'description' | 'organizationId' | 'status' | 'settings'>;

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare ownerId: string;
  declare organizationId: string | null;
  declare status: 'active' | 'archived' | 'generating' | 'ready';
  declare settings: object | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Project.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerId: { type: DataTypes.UUID, allowNull: false },
    organizationId: { type: DataTypes.UUID, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'generating', 'ready'),
      allowNull: false,
      defaultValue: 'active',
    },
    settings: { type: DataTypes.JSON, allowNull: true },
  },
  { sequelize, modelName: 'Project', tableName: 'projects', timestamps: true }
);

export default Project;
