import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

export interface ArchitectureVersionAttributes {
  id: string;
  projectId: string;
  versionNumber: number;
  label?: string | null;
  architectureData: object; // Full architecture JSON
  databaseSchema?: object | null;
  apiSpec?: object | null;
  cloudMapping?: object | null;
  terraformCode?: string | null;
  isCurrent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ArchitectureVersionCreationAttributes = Optional<
  ArchitectureVersionAttributes,
  'id' | 'label' | 'databaseSchema' | 'apiSpec' | 'cloudMapping' | 'terraformCode' | 'isCurrent'
>;

export class ArchitectureVersion
  extends Model<ArchitectureVersionAttributes, ArchitectureVersionCreationAttributes>
  implements ArchitectureVersionAttributes {
  declare id: string;
  declare projectId: string;
  declare versionNumber: number;
  declare label: string | null;
  declare architectureData: object;
  declare databaseSchema: object | null;
  declare apiSpec: object | null;
  declare cloudMapping: object | null;
  declare terraformCode: string | null;
  declare isCurrent: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ArchitectureVersion.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    versionNumber: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(200), allowNull: true },
    architectureData: { type: DataTypes.JSON, allowNull: false },
    databaseSchema: { type: DataTypes.JSON, allowNull: true },
    apiSpec: { type: DataTypes.JSON, allowNull: true },
    cloudMapping: { type: DataTypes.JSON, allowNull: true },
    terraformCode: { type: DataTypes.TEXT, allowNull: true },
    isCurrent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: 'ArchitectureVersion', tableName: 'architecture_versions', timestamps: true }
);

export default ArchitectureVersion;
