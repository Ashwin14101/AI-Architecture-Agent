import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface OrganizationAttributes {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrganizationCreationAttributes = Optional<OrganizationAttributes, 'id' | 'description'>;

export class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Organization.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Organization', tableName: 'organizations', timestamps: true }
);

export default Organization;
