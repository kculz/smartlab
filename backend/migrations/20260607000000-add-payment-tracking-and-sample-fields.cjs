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

async function hasTable(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName || table.name;
    return name === tableName;
  });
}

async function hasColumn(queryInterface, tableName, columnName) {
  if (!(await hasTable(queryInterface, tableName))) {
    return false;
  }

  const columns = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(columns, columnName);
}

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
  if (!(await hasColumn(queryInterface, tableName, columnName))) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

module.exports = {
  async up(queryInterface) {
    await addColumnIfMissing(queryInterface, 'invoices', 'amount_paid', {
      allowNull: false,
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    });

    await addColumnIfMissing(queryInterface, 'invoices', 'balance_due', {
      allowNull: false,
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    });

    await addColumnIfMissing(queryInterface, 'samples', 'specimen_type', {
      allowNull: false,
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
    });

    await addColumnIfMissing(queryInterface, 'samples', 'priority', {
      allowNull: false,
      type: DataTypes.ENUM('Routine', 'Urgent', 'STAT'),
      defaultValue: 'Routine',
    });

    if (await hasTable(queryInterface, 'invoices')) {
      await queryInterface.sequelize.query(`
        UPDATE invoices
        SET
          amount_paid = CASE
            WHEN status = 'Paid' THEN total_amount
            ELSE COALESCE(amount_paid, 0)
          END,
          balance_due = CASE
            WHEN status = 'Paid' THEN 0
            ELSE GREATEST(total_amount - COALESCE(amount_paid, 0), 0)
          END
      `);
    }

    if (!(await hasTable(queryInterface, 'invoice_payments'))) {
      await queryInterface.createTable('invoice_payments', {
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
        payer_name: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        payment_method: {
          allowNull: false,
          type: DataTypes.ENUM('Cash', 'Card', 'Mobile Money', 'Bank Transfer'),
        },
        amount_tendered: {
          allowNull: false,
          type: DataTypes.DECIMAL(14, 2),
        },
        amount_applied: {
          allowNull: false,
          type: DataTypes.DECIMAL(14, 2),
        },
        change_given: {
          allowNull: false,
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        reference_number: {
          allowNull: true,
          type: DataTypes.STRING,
        },
        notes: {
          allowNull: true,
          type: DataTypes.TEXT,
        },
        received_by: {
          allowNull: true,
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        paid_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      });
    }
  },

  async down(queryInterface) {
    if (await hasTable(queryInterface, 'invoice_payments')) {
      await queryInterface.dropTable('invoice_payments');
    }

    if (await hasColumn(queryInterface, 'samples', 'priority')) {
      await queryInterface.removeColumn('samples', 'priority');
    }

    if (await hasColumn(queryInterface, 'samples', 'specimen_type')) {
      await queryInterface.removeColumn('samples', 'specimen_type');
    }

    if (await hasColumn(queryInterface, 'invoices', 'balance_due')) {
      await queryInterface.removeColumn('invoices', 'balance_due');
    }

    if (await hasColumn(queryInterface, 'invoices', 'amount_paid')) {
      await queryInterface.removeColumn('invoices', 'amount_paid');
    }
  },
};
