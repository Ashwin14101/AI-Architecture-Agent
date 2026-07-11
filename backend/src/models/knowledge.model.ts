import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface KnowledgeAttributes {
  id: string;
  projectId?: string | null;
  source: string;
  title: string;
  content: string;
  tags?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type KnowledgeCreationAttributes = Optional<KnowledgeAttributes, 'id' | 'projectId' | 'tags'>;

export class Knowledge extends Model<KnowledgeAttributes, KnowledgeCreationAttributes> implements KnowledgeAttributes {
  declare id: string;
  declare projectId: string | null;
  declare source: string;
  declare title: string;
  declare content: string;
  declare tags: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Knowledge.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
    source: { type: DataTypes.STRING(200), allowNull: false },
    title: { type: DataTypes.STRING(500), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    tags: { type: DataTypes.STRING(500), allowNull: true },
  },
  { sequelize, modelName: 'Knowledge', tableName: 'knowledge', timestamps: true }
);

export default Knowledge;
