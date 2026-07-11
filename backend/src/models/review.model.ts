import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface ReviewAttributes {
  id: string;
  projectId: string;
  versionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: string | null;
  score?: number | null; // 0–100
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReviewCreationAttributes = Optional<ReviewAttributes, 'id' | 'summary' | 'score' | 'status'>;

export class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  declare id: string;
  declare projectId: string;
  declare versionId: string;
  declare status: 'pending' | 'running' | 'completed' | 'failed';
  declare summary: string | null;
  declare score: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Review.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    versionId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    summary: { type: DataTypes.TEXT, allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'Review', tableName: 'reviews', timestamps: true }
);

export default Review;
