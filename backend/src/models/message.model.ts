import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface MessageAttributes {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  metadata?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MessageCreationAttributes = Optional<MessageAttributes, 'id' | 'metadata'>;

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  declare id: string;
  declare conversationId: string;
  declare sender: 'user' | 'ai';
  declare content: string;
  declare metadata: object | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    sender: { type: DataTypes.ENUM('user', 'ai'), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { sequelize, modelName: 'Message', tableName: 'messages', timestamps: true }
);

export default Message;
