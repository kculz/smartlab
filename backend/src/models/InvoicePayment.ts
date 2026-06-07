import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Invoice from './Invoice.js';
import User from './User.js';

class InvoicePayment extends Model {
  public id!: number;
  public invoice_id!: number;
  public payer_name!: string;
  public payment_method!: string;
  public amount_tendered!: number;
  public amount_applied!: number;
  public change_given!: number;
  public reference_number!: string | null;
  public notes!: string | null;
  public received_by!: number | null;
  public paid_at!: Date;
}

InvoicePayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Invoice,
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    payer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM('Cash', 'Card', 'Mobile Money', 'Bank Transfer'),
      allowNull: false,
    },
    amount_tendered: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    amount_applied: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    change_given: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    reference_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    received_by: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: true,
      onDelete: 'SET NULL',
    },
    paid_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'invoice_payments',
    timestamps: false,
  }
);

InvoicePayment.belongsTo(Invoice, { foreignKey: 'invoice_id' });
InvoicePayment.belongsTo(User, { foreignKey: 'received_by' });
Invoice.hasMany(InvoicePayment, { foreignKey: 'invoice_id' });

export default InvoicePayment;
