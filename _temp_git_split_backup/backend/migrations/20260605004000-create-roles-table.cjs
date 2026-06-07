const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const existingTables = await queryInterface.showAllTables();
    const tableNames = existingTables.map((table) =>
      typeof table === 'string' ? table : table.tableName || table.name
    );

    if (tableNames.includes('roles')) {
      return;
    }

    await queryInterface.createTable('roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      display_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      dashboard_label: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      default_route: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      is_active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sort_order: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  },
};
