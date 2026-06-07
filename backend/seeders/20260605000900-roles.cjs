module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM roles WHERE name = 'admin'"
    );

    if (rows[0] && Number(rows[0].count) > 0) {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert('roles', [
      {
        id: 1,
        name: 'admin',
        display_name: 'Admin',
        description: 'Full platform administration and configuration access.',
        dashboard_label: 'System control',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'receptionist',
        display_name: 'Receptionist',
        description: 'Registers patients and handles billing at the front desk.',
        dashboard_label: 'Reception desk',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: 'lab_technician',
        display_name: 'Lab Technician',
        description: 'Handles sample processing and result capture.',
        dashboard_label: 'Lab workflow',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        name: 'doctor',
        display_name: 'Doctor',
        description: 'Reviews and approves clinical results.',
        dashboard_label: 'Clinical review',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        name: 'manager',
        display_name: 'Manager',
        description: 'Oversees operations, revenue, and staffing metrics.',
        dashboard_label: 'Operations view',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 5,
        created_at: now,
        updated_at: now,
      },
      {
        id: 6,
        name: 'nurse',
        display_name: 'Nurse',
        description: 'Supports patient coordination and follow-up workflows.',
        dashboard_label: 'Care support',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 6,
        created_at: now,
        updated_at: now,
      },
      {
        id: 7,
        name: 'patient',
        display_name: 'Patient',
        description: 'Views personal results, invoices, and notifications.',
        dashboard_label: 'Patient portal',
        default_route: '/dashboard',
        is_active: true,
        sort_order: 7,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
