import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Sample from './Sample.js';
import Test from './Test.js';

class SampleTest extends Model {
  public id!: number;
  public sample_id!: number;
  public test_id!: number;
  public status!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

SampleTest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sample_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Sample,
        key: 'id',
      },
      allowNull: false,
    },
    test_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Test,
        key: 'id',
      },
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'Pending',
        'In Progress',
        'Completed',
        'Approved',
        'Rejected'
      ),
      defaultValue: 'Pending',
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
    tableName: 'sample_tests',
    timestamps: false,
  }
);

SampleTest.belongsTo(Sample, { foreignKey: 'sample_id' });
SampleTest.belongsTo(Test, { foreignKey: 'test_id' });
Sample.hasMany(SampleTest, { foreignKey: 'sample_id' });

export default SampleTest;
