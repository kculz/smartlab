import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Patient from './Patient.js';
import User from './User.js';

class Invoice extends Model {
  public id!: number;
  public invoice_number!: string;
  public patient_id!: number;
  public total_amount!: number;
  public amount_paid!: number;
  public balance_due!: number;
  public currency!: string;
  public status!: string;
  public created_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_number: {
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
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    balance_due: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.ENUM('USD', 'ZWL'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'Pending',
        'Partially Paid',
        'Paid',
        'Cancelled'
      ),
      defaultValue: 'Pending',
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'SET NULL',
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
    tableName: 'invoices',
    timestamps: false,
  }
);

Invoice.belongsTo(Patient, { foreignKey: 'patient_id' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });

export default Invoice;
