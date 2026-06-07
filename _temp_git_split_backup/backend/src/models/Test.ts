import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import TestCategory from './TestCategory.js';

class Test extends Model {
  public id!: number;
  public test_category_id!: number;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public currency!: string;
  public unit!: string | null;
  public reference_range!: string | null;
  public turnaround_hours!: number | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Test.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    test_category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: TestCategory,
        key: 'id',
      },
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM('USD', 'ZWL'),
      defaultValue: 'USD',
    },
    unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Measurement unit e.g. mmol/L, g/dL, ×10⁹/L',
    },
    reference_range: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Normal range e.g. 3.5–5.0 mmol/L or <200 mg/dL',
    },
    turnaround_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Expected turnaround time in hours',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'tests',
    timestamps: false,
  }
);

Test.belongsTo(TestCategory, { foreignKey: 'test_category_id' });

export default Test;
