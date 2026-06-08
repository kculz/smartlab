import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import SampleTest from './SampleTest.js';

class Result extends Model {
  public id!: number;
  public sample_test_id!: number;
  public value!: string;
  public unit!: string | null;
  public reference_range!: string | null;
  public interpretation!: string | null;
  public doctor_note!: string | null;
  public status!: string;
  public approved_by!: number | null;
  public approved_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Result.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sample_test_id: {
      type: DataTypes.INTEGER,
      references: {
        model: SampleTest,
        key: 'id',
      },
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Measurement unit e.g. mmol/L',
    },
    reference_range: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Reference range at time of result capture',
    },
    interpretation: {
      type: DataTypes.ENUM('Normal', 'Abnormal', 'Borderline', 'Critical', 'Inconclusive'),
      allowNull: true,
      comment: 'Lab technician interpretation flag',
    },
    doctor_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Doctor note added during approval',
    },
    status: {
      type: DataTypes.ENUM('Normal', 'Abnormal', 'Pending Review', 'Rejected'),
      defaultValue: 'Pending Review',
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID of the doctor who approved',
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'results',
    timestamps: false,
  }
);

Result.belongsTo(SampleTest, { foreignKey: 'sample_test_id' });
SampleTest.hasOne(Result, { foreignKey: 'sample_test_id' });

export default Result;
