import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface RequirementAttributes {
  id: string;
  projectId: string;
  documentId?: string | null;
  title: string;
  description: string;
  category: 'functional' | 'non-functional' | 'technical' | 'security' | 'performance';
  priority: 'high' | 'medium' | 'low';
  createdAt?: Date;
  updatedAt?: Date;
}

export type RequirementCreationAttributes = Optional<RequirementAttributes, 'id' | 'documentId' | 'priority'>;

export class Requirement extends Model<RequirementAttributes, RequirementCreationAttributes> implements RequirementAttributes {
  declare id: string;
  declare projectId: string;
  declare documentId: string | null;
  declare title: string;
  declare description: string;
  declare category: 'functional' | 'non-functional' | 'technical' | 'security' | 'performance';
  declare priority: 'high' | 'medium' | 'low';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Requirement.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    documentId: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING(500), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: {
      type: DataTypes.ENUM('functional', 'non-functional', 'technical', 'security', 'performance'),
      allowNull: false,
      defaultValue: 'functional',
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
  },
  { sequelize, modelName: 'Requirement', tableName: 'requirements', timestamps: true }
);

export default Requirement;
