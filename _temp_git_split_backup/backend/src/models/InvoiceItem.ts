import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Invoice from './Invoice.js';
import Test from './Test.js';

class InvoiceItem extends Model {
  public id!: number;
  public invoice_id!: number;
  public test_id!: number;
  public price!: number;
  public currency!: string;
  public created_at!: Date;
}

InvoiceItem.init(
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
    test_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Test,
        key: 'id',
      },
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM('USD', 'ZWL'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'invoice_items',
    timestamps: false,
  }
);

InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Test, { foreignKey: 'test_id' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });

export default InvoiceItem;
