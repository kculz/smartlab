require('dotenv').config();

const rawDbHost = process.env.DB_HOST || 'localhost';
const dbHost = process.platform === 'win32' && rawDbHost === 'localhost' ? '127.0.0.1' : rawDbHost;

if (process.platform === 'win32' && rawDbHost === 'localhost') {
  console.warn('Using DB_HOST=127.0.0.1 on Windows because localhost can resolve to IPv6 and fail to connect.');
}

const baseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartlab_db',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    database: process.env.DB_NAME_TEST || `${baseConfig.database}_test`,
  },
  production: baseConfig,
};
