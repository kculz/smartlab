import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Patient from './Patient.js';
import User from './User.js';

class Sample extends Model {
  public id!: number;
  public sample_id!: string;
  public patient_id!: number;
  public registered_by!: number;
  public specimen_type!: string;
  public priority!: string;
  public current_status!: string;
  public current_stage!: string;
  public notes!: string | null;
  public collected_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Sample.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sample_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Patient,
        key: 'id',
      },
      allowNull: false,
    },
    registered_by: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    specimen_type: {
      type: DataTypes.ENUM(
        'Blood',
        'Urine',
        'Stool',
        'Swab',
        'Sputum',
        'Saliva',
        'Tissue',
        'Other'
      ),
      defaultValue: 'Blood',
    },
    priority: {
      type: DataTypes.ENUM('Routine', 'Urgent', 'STAT'),
      defaultValue: 'Routine',
    },
    current_status: {
      type: DataTypes.ENUM(
        'Pending',
        'In Progress',
        'Completed',
        'Reported',
        'Released'
      ),
      defaultValue: 'Pending',
    },
    current_stage: {
      type: DataTypes.ENUM(
        'Reception',
        'Lab',
        'Doctor Review',
        'Pharmacy',
        'Completed'
      ),
      defaultValue: 'Reception',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    collected_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the specimen was physically collected — used for TAT calculation',
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
    tableName: 'samples',
    timestamps: false,
  }
);

Sample.belongsTo(Patient, { foreignKey: 'patient_id' });
Sample.belongsTo(User, { foreignKey: 'registered_by', as: 'registeredBy' });

export default Sample;
