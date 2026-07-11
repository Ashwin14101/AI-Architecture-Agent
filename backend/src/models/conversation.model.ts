import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface ConversationAttributes {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ConversationCreationAttributes = Optional<ConversationAttributes, 'id'>;

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  declare id: string;
  declare projectId: string;
  declare userId: string;
  declare title: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Conversation.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(300), allowNull: false, defaultValue: 'New Conversation' },
  },
  { sequelize, modelName: 'Conversation', tableName: 'conversations', timestamps: true }
);

export default Conversation;
