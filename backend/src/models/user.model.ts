import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface UserAttributes {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  organizationId?: string | null;
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'role' | 'organizationId' | 'refreshToken'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare role: 'user' | 'admin';
  declare organizationId: string | null;
  declare refreshToken: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
    organizationId: { type: DataTypes.UUID, allowNull: true },
    refreshToken: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'User', tableName: 'users', timestamps: true }
);

export default User;
