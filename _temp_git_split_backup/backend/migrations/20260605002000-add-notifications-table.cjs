const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const existingTables = await queryInterface.showAllTables();
    const tableNames = existingTables.map((table) =>
      typeof table === 'string' ? table : table.tableName || table.name
    );

    if (tableNames.includes('notifications')) {
      return;
    }

    await queryInterface.createTable('notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      message: { allowNull: false, type: DataTypes.TEXT },
      is_read: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
