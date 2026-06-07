import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const rawDbHost = process.env.DB_HOST || 'localhost';
const dbHost = process.platform === 'win32' && rawDbHost === 'localhost' ? '127.0.0.1' : rawDbHost;

if (process.platform === 'win32' && rawDbHost === 'localhost') {
  console.warn('Using DB_HOST=127.0.0.1 on Windows because localhost can resolve to IPv6 and fail to connect.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smartlab_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

export default sequelize;
