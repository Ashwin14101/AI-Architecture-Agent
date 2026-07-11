import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface DocumentAttributes {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  extractedText?: string | null;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}

export type DocumentCreationAttributes = Optional<DocumentAttributes, 'id' | 'extractedText' | 'status'>;

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  declare id: string;
  declare projectId: string;
  declare name: string;
  declare originalName: string;
  declare filePath: string;
  declare fileSize: number;
  declare mimeType: string;
  declare extractedText: string | null;
  declare status: 'uploaded' | 'processing' | 'processed' | 'failed';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Document.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    extractedText: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('uploaded', 'processing', 'processed', 'failed'),
      allowNull: false,
      defaultValue: 'uploaded',
    },
  },
  { sequelize, modelName: 'Document', tableName: 'documents', timestamps: true }
);

export default Document;
