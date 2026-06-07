const { DataTypes } = require('sequelize');

const timestampColumns = {
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
};

module.exports = {
  async up(queryInterface) {
    const existingTables = await queryInterface.showAllTables();
    const tableNames = existingTables.map((table) =>
      typeof table === 'string' ? table : table.tableName || table.name
    );

    if (tableNames.includes('users')) {
      return;
    }

    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      email: { allowNull: false, type: DataTypes.STRING, unique: true },
      password: { allowNull: false, type: DataTypes.STRING },
      full_name: { allowNull: false, type: DataTypes.STRING },
      phone: { allowNull: true, type: DataTypes.STRING },
      role: {
        allowNull: false,
        type: DataTypes.ENUM(
          'admin',
          'receptionist',
          'lab_technician',
          'doctor',
          'nurse',
          'manager',
          'patient'
        ),
        defaultValue: 'patient',
      },
      is_active: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: true },
      ...timestampColumns,
    });

    await queryInterface.createTable('patients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      user_id: {
        allowNull: true,
        type: DataTypes.INTEGER,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      first_name: { allowNull: false, type: DataTypes.STRING },
      last_name: { allowNull: false, type: DataTypes.STRING },
      phone: { allowNull: false, type: DataTypes.STRING },
      email: { allowNull: false, type: DataTypes.STRING },
      date_of_birth: { allowNull: true, type: DataTypes.DATE },
      gender: { allowNull: true, type: DataTypes.ENUM('Male', 'Female', 'Other') },
      address: { allowNull: true, type: DataTypes.STRING },
      city: { allowNull: true, type: DataTypes.STRING },
      ...timestampColumns,
    });

    await queryInterface.createTable('test_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: { allowNull: false, type: DataTypes.STRING, unique: true },
      description: { allowNull: true, type: DataTypes.TEXT },
      is_active: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: true },
      ...timestampColumns,
    });

    await queryInterface.createTable('tests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      test_category_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'test_categories', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { allowNull: false, type: DataTypes.STRING },
      description: { allowNull: true, type: DataTypes.TEXT },
      price: { allowNull: false, type: DataTypes.DECIMAL(14, 2) },
      currency: {
        allowNull: false,
        type: DataTypes.ENUM('USD', 'ZWL'),
        defaultValue: 'USD',
      },
      is_active: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: true },
      ...timestampColumns,
    });

    await queryInterface.createTable('samples', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      sample_id: { allowNull: false, type: DataTypes.STRING, unique: true },
      patient_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'patients', key: 'id' },
        onDelete: 'CASCADE',
      },
      registered_by: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      current_status: {
        allowNull: false,
        type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Reported', 'Released'),
        defaultValue: 'Pending',
      },
      current_stage: {
        allowNull: false,
        type: DataTypes.ENUM('Reception', 'Lab', 'Doctor Review', 'Pharmacy', 'Completed'),
        defaultValue: 'Reception',
      },
      notes: { allowNull: true, type: DataTypes.TEXT },
      ...timestampColumns,
    });

    await queryInterface.createTable('sample_tests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      sample_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'samples', key: 'id' },
        onDelete: 'CASCADE',
      },
      test_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'tests', key: 'id' },
        onDelete: 'RESTRICT',
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
      },
      ...timestampColumns,
    });

    await queryInterface.createTable('results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      sample_test_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'sample_tests', key: 'id' },
        onDelete: 'CASCADE',
      },
      value: { allowNull: false, type: DataTypes.STRING },
      status: {
        allowNull: false,
        type: DataTypes.ENUM('Normal', 'Abnormal', 'Pending Review'),
        defaultValue: 'Pending Review',
      },
      ...timestampColumns,
    });

    await queryInterface.createTable('invoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      invoice_number: { allowNull: false, type: DataTypes.STRING, unique: true },
      patient_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'patients', key: 'id' },
        onDelete: 'CASCADE',
      },
      total_amount: { allowNull: false, type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      currency: { allowNull: false, type: DataTypes.ENUM('USD', 'ZWL') },
      status: {
        allowNull: false,
        type: DataTypes.ENUM('Pending', 'Partially Paid', 'Paid', 'Cancelled'),
        defaultValue: 'Pending',
      },
      created_by: {
        allowNull: true,
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestampColumns,
    });

    await queryInterface.createTable('invoice_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      invoice_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'invoices', key: 'id' },
        onDelete: 'CASCADE',
      },
      test_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: { model: 'tests', key: 'id' },
        onDelete: 'RESTRICT',
      },
      price: { allowNull: false, type: DataTypes.DECIMAL(14, 2) },
      currency: { allowNull: false, type: DataTypes.ENUM('USD', 'ZWL') },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

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
    await queryInterface.dropTable('invoice_items');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('results');
    await queryInterface.dropTable('sample_tests');
    await queryInterface.dropTable('samples');
    await queryInterface.dropTable('tests');
    await queryInterface.dropTable('test_categories');
    await queryInterface.dropTable('patients');
    await queryInterface.dropTable('users');
  },
};
