const { DataTypes } = require('sequelize');

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
    // tests table
    await addColumnIfMissing(queryInterface, 'tests', 'unit', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'tests', 'reference_range', {
      type: DataTypes.STRING(200),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'tests', 'turnaround_hours', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    // samples table
    await addColumnIfMissing(queryInterface, 'samples', 'collected_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    // results table
    // Modify column value (from default 255 to 500)
    if (await hasColumn(queryInterface, 'results', 'value')) {
      await queryInterface.changeColumn('results', 'value', {
        type: DataTypes.STRING(500),
        allowNull: false,
      });
    }

    // Modify column status (to include 'Rejected')
    if (await hasColumn(queryInterface, 'results', 'status')) {
      await queryInterface.changeColumn('results', 'status', {
        type: DataTypes.ENUM('Normal', 'Abnormal', 'Pending Review', 'Rejected'),
        defaultValue: 'Pending Review',
        allowNull: false,
      });
    }

    await addColumnIfMissing(queryInterface, 'results', 'unit', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'results', 'reference_range', {
      type: DataTypes.STRING(200),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'results', 'interpretation', {
      type: DataTypes.ENUM('Normal', 'Abnormal', 'Borderline', 'Critical', 'Inconclusive'),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'results', 'doctor_note', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'results', 'approved_by', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });
    await addColumnIfMissing(queryInterface, 'results', 'approved_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    // Add indexes (if they don't exist)
    try {
      await queryInterface.addIndex('results', ['status'], {
        name: 'results_status_idx',
      });
    } catch (e) {
      // Index might already exist
    }
    try {
      await queryInterface.addIndex('results', ['approved_by'], {
        name: 'results_approved_by_idx',
      });
    } catch (e) {
      // Index might already exist
    }
  },

  async down(queryInterface) {
    const columnsToRemoveFromResults = [
      'approved_at',
      'approved_by',
      'doctor_note',
      'interpretation',
      'reference_range',
      'unit',
    ];
    for (const col of columnsToRemoveFromResults) {
      if (await hasColumn(queryInterface, 'results', col)) {
        await queryInterface.removeColumn('results', col);
      }
    }

    if (await hasColumn(queryInterface, 'results', 'status')) {
      await queryInterface.changeColumn('results', 'status', {
        type: DataTypes.ENUM('Normal', 'Abnormal', 'Pending Review'),
        defaultValue: 'Pending Review',
        allowNull: false,
      });
    }

    if (await hasColumn(queryInterface, 'results', 'value')) {
      await queryInterface.changeColumn('results', 'value', {
        type: DataTypes.STRING(255),
        allowNull: false,
      });
    }

    if (await hasColumn(queryInterface, 'samples', 'collected_at')) {
      await queryInterface.removeColumn('samples', 'collected_at');
    }

    const columnsToRemoveFromTests = ['turnaround_hours', 'reference_range', 'unit'];
    for (const col of columnsToRemoveFromTests) {
      if (await hasColumn(queryInterface, 'tests', col)) {
        await queryInterface.removeColumn('tests', col);
      }
    }
  }
};
