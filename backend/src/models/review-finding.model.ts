import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface ReviewFindingAttributes {
  id: string;
  reviewId: string;
  ruleId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  affectedComponent?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReviewFindingCreationAttributes = Optional<ReviewFindingAttributes, 'id' | 'affectedComponent' | 'status'>;

export class ReviewFinding
  extends Model<ReviewFindingAttributes, ReviewFindingCreationAttributes>
  implements ReviewFindingAttributes {
  declare id: string;
  declare reviewId: string;
  declare ruleId: string;
  declare severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  declare category: string;
  declare title: string;
  declare description: string;
  declare recommendation: string;
  declare affectedComponent: string | null;
  declare status: 'pending' | 'accepted' | 'rejected';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ReviewFinding.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    reviewId: { type: DataTypes.UUID, allowNull: false },
    ruleId: { type: DataTypes.STRING(100), allowNull: false },
    severity: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low', 'info'),
      allowNull: false,
    },
    category: { type: DataTypes.STRING(100), allowNull: false },
    title: { type: DataTypes.STRING(300), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    recommendation: { type: DataTypes.TEXT, allowNull: false },
    affectedComponent: { type: DataTypes.STRING(200), allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  { sequelize, modelName: 'ReviewFinding', tableName: 'review_findings', timestamps: true }
);

export default ReviewFinding;
