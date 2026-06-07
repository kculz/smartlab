const bcrypt = require('bcryptjs');

const passwordHash = bcrypt.hashSync('Password123!', 10);

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM users WHERE email = 'admin@smartlab.test'"
    );

    if (rows[0] && Number(rows[0].count) > 0) {
      return;
    }

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        email: 'admin@smartlab.test',
        password: passwordHash,
        full_name: 'System Admin',
        phone: '0700000001',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        email: 'reception@smartlab.test',
        password: passwordHash,
        full_name: 'Reception Desk',
        phone: '0700000002',
        role: 'receptionist',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        email: 'labtech@smartlab.test',
        password: passwordHash,
        full_name: 'Lab Technician',
        phone: '0700000003',
        role: 'lab_technician',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        email: 'doctor@smartlab.test',
        password: passwordHash,
        full_name: 'Dr. Review',
        phone: '0700000004',
        role: 'doctor',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        email: 'patient@smartlab.test',
        password: passwordHash,
        full_name: 'Demo Patient',
        phone: '0700000005',
        role: 'patient',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 6,
        email: 'patient2@smartlab.test',
        password: passwordHash,
        full_name: 'John Doe',
        phone: '0700000006',
        role: 'patient',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 7,
        email: 'patient3@smartlab.test',
        password: passwordHash,
        full_name: 'Jane Smith',
        phone: '0700000007',
        role: 'patient',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('patients', [
      {
        id: 1,
        user_id: 5,
        first_name: 'Demo',
        last_name: 'Patient',
        phone: '0700000005',
        email: 'patient@smartlab.test',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Female',
        address: '123 Demo Street',
        city: 'Harare',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        user_id: 6,
        first_name: 'John',
        last_name: 'Doe',
        phone: '0700000006',
        email: 'patient2@smartlab.test',
        date_of_birth: new Date('1985-05-15'),
        gender: 'Male',
        address: '456 Union Ave',
        city: 'Harare',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        user_id: 7,
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '0700000007',
        email: 'patient3@smartlab.test',
        date_of_birth: new Date('1992-08-22'),
        gender: 'Female',
        address: '789 Broad Way',
        city: 'Bulawayo',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        user_id: null,
        first_name: 'Robert',
        last_name: 'Jones',
        phone: '0700000008',
        email: 'patient4@smartlab.test',
        date_of_birth: new Date('1978-11-30'),
        gender: 'Male',
        address: '12 Pioneer Rd',
        city: 'Mutare',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        user_id: null,
        first_name: 'Alice',
        last_name: 'Brown',
        phone: '0700000009',
        email: 'patient5@smartlab.test',
        date_of_birth: new Date('2001-03-04'),
        gender: 'Female',
        address: '88 Kingsway Lane',
        city: 'Gweru',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('test_categories', [
      {
        id: 1,
        name: 'Hematology',
        description: 'Blood-related laboratory tests',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Biochemistry',
        description: 'Chemical analysis tests',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('tests', [
      {
        id: 1,
        test_category_id: 1,
        name: 'Full Blood Count',
        description: 'Baseline blood count panel',
        price: 25.0,
        currency: 'USD',
        unit: 'g/dL',
        reference_range: '12.0–16.0 g/dL',
        turnaround_hours: 24,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        test_category_id: 2,
        name: 'Blood Glucose',
        description: 'Glucose screening',
        price: 15.0,
        currency: 'USD',
        unit: 'mmol/L',
        reference_range: '3.9–5.6 mmol/L',
        turnaround_hours: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('samples', [
      {
        id: 1,
        sample_id: 'SM-DEMO-0001',
        patient_id: 1,
        registered_by: 2,
        specimen_type: 'Blood',
        priority: 'Routine',
        current_status: 'In Progress',
        current_stage: 'Doctor Review',
        notes: 'Demo sample for doctor review testing',
        collected_at: new Date(Date.now() - 3600000), // 1 hour ago
        created_at: new Date(Date.now() - 3600000),
        updated_at: new Date(),
      },
      {
        id: 2,
        sample_id: 'SM-DEMO-0002',
        patient_id: 2,
        registered_by: 2,
        specimen_type: 'Urine',
        priority: 'Urgent',
        current_status: 'Pending',
        current_stage: 'Reception',
        notes: 'Urgent sample registered at reception, pending collection/lab handoff',
        collected_at: null,
        created_at: new Date(Date.now() - 1800000), // 30 mins ago
        updated_at: new Date(),
      },
      {
        id: 3,
        sample_id: 'SM-DEMO-0003',
        patient_id: 3,
        registered_by: 2,
        specimen_type: 'Blood',
        priority: 'STAT',
        current_status: 'In Progress',
        current_stage: 'Lab',
        notes: 'STAT priority blood sample actively undergoing testing in lab',
        collected_at: new Date(Date.now() - 900000), // 15 mins ago
        created_at: new Date(Date.now() - 900000),
        updated_at: new Date(),
      },
      {
        id: 4,
        sample_id: 'SM-DEMO-0004',
        patient_id: 4,
        registered_by: 2,
        specimen_type: 'Blood',
        priority: 'Routine',
        current_status: 'In Progress',
        current_stage: 'Doctor Review',
        notes: 'Routine sample with completed abnormal test results awaiting review',
        collected_at: new Date(Date.now() - 7200000), // 2 hours ago
        created_at: new Date(Date.now() - 7200000),
        updated_at: new Date(),
      },
      {
        id: 5,
        sample_id: 'SM-DEMO-0005',
        patient_id: 5,
        registered_by: 2,
        specimen_type: 'Blood',
        priority: 'STAT',
        current_status: 'In Progress',
        current_stage: 'Doctor Review',
        notes: 'STAT sample with critical results requiring urgent doctor approval',
        collected_at: new Date(Date.now() - 600000), // 10 mins ago
        created_at: new Date(Date.now() - 600000),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('sample_tests', [
      // Sample 1: One completed awaiting review, one approved
      {
        id: 1,
        sample_id: 1,
        test_id: 1,
        status: 'Completed',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        sample_id: 1,
        test_id: 2,
        status: 'Approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Sample 2: Pending
      {
        id: 3,
        sample_id: 2,
        test_id: 1,
        status: 'Pending',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Sample 3: Active in lab (both pending)
      {
        id: 4,
        sample_id: 3,
        test_id: 1,
        status: 'Pending',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        sample_id: 3,
        test_id: 2,
        status: 'Pending',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Sample 4: Completed, awaiting review
      {
        id: 6,
        sample_id: 4,
        test_id: 1,
        status: 'Completed',
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Sample 5: Completed (STAT), awaiting review
      {
        id: 7,
        sample_id: 5,
        test_id: 2,
        status: 'Completed',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('results', [
      // Result for Sample 1 Test 1 (Awaiting doctor review - Normal)
      {
        id: 1,
        sample_test_id: 1,
        value: '13.8',
        status: 'Pending Review',
        unit: 'g/dL',
        reference_range: '12.0–16.0 g/dL',
        interpretation: 'Normal',
        doctor_note: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Result for Sample 1 Test 2 (Already Approved)
      {
        id: 2,
        sample_test_id: 2,
        value: '5.2',
        status: 'Normal',
        unit: 'mmol/L',
        reference_range: '3.9–5.6 mmol/L',
        interpretation: 'Normal',
        doctor_note: 'Glycemic level normal, no action required.',
        approved_by: 4,
        approved_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Result for Sample 4 Test 1 (Awaiting doctor review - Abnormal)
      {
        id: 3,
        sample_test_id: 6,
        value: '10.5',
        status: 'Pending Review',
        unit: 'g/dL',
        reference_range: '12.0–16.0 g/dL',
        interpretation: 'Abnormal',
        doctor_note: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Result for Sample 5 Test 2 (Awaiting doctor review - Critical STAT)
      {
        id: 4,
        sample_test_id: 7,
        value: '11.8',
        status: 'Pending Review',
        unit: 'mmol/L',
        reference_range: '3.9–5.6 mmol/L',
        interpretation: 'Critical',
        doctor_note: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('invoices', [
      {
        id: 1,
        invoice_number: 'INV-DEMO-0001',
        patient_id: 1,
        total_amount: 40.0,
        amount_paid: 15.0,
        balance_due: 25.0,
        currency: 'USD',
        status: 'Partially Paid',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        invoice_number: 'INV-DEMO-0002',
        patient_id: 1,
        total_amount: 25.0,
        amount_paid: 25.0,
        balance_due: 0,
        currency: 'USD',
        status: 'Paid',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        invoice_number: 'INV-DEMO-0003',
        patient_id: 2,
        total_amount: 25.0,
        amount_paid: 0.0,
        balance_due: 25.0,
        currency: 'USD',
        status: 'Pending',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        invoice_number: 'INV-DEMO-0004',
        patient_id: 3,
        total_amount: 40.0,
        amount_paid: 0.0,
        balance_due: 40.0,
        currency: 'USD',
        status: 'Pending',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        invoice_number: 'INV-DEMO-0005',
        patient_id: 4,
        total_amount: 25.0,
        amount_paid: 25.0,
        balance_due: 0.0,
        currency: 'USD',
        status: 'Paid',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('invoice_items', [
      {
        id: 1,
        invoice_id: 1,
        test_id: 1,
        price: 25.0,
        currency: 'USD',
        created_at: new Date(),
      },
      {
        id: 2,
        invoice_id: 1,
        test_id: 2,
        price: 15.0,
        currency: 'USD',
        created_at: new Date(),
      },
      {
        id: 3,
        invoice_id: 2,
        test_id: 1,
        price: 25.0,
        currency: 'USD',
        created_at: new Date(),
      },
      {
        id: 4,
        invoice_id: 3,
        test_id: 1,
        price: 25.0,
        currency: 'USD',
        created_at: new Date(),
      },
      {
        id: 5,
        invoice_id: 4,
        test_id: 1,
        price: 25.0,
        currency: 'USD',
        created_at: new Date(),
      },
      {
        id: 6,
        invoice_id: 4,
        test_id: 2,
        price: 15.0,
        currency: 'USD',
        created_at: new Date(),
      },
      {
        id: 7,
        invoice_id: 5,
        test_id: 1,
        price: 25.0,
        currency: 'USD',
        created_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('invoice_payments', [
      {
        id: 1,
        invoice_id: 1,
        payer_name: 'Demo Patient',
        payment_method: 'Cash',
        amount_tendered: 20.0,
        amount_applied: 15.0,
        change_given: 5.0,
        reference_number: 'CASH-0001',
        notes: 'Partial cash payment at reception',
        received_by: 2,
        paid_at: new Date(),
      },
      {
        id: 2,
        invoice_id: 2,
        payer_name: 'Demo Patient',
        payment_method: 'Mobile Money',
        amount_tendered: 25.0,
        amount_applied: 25.0,
        change_given: 0,
        reference_number: 'MM-0002',
        notes: 'Full settlement on pickup',
        received_by: 2,
        paid_at: new Date(),
      },
      {
        id: 3,
        invoice_id: 5,
        payer_name: 'Robert Jones',
        payment_method: 'Card',
        amount_tendered: 25.0,
        amount_applied: 25.0,
        change_given: 0,
        reference_number: 'CARD-0005',
        notes: 'Card payment in full',
        received_by: 2,
        paid_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('notifications', [
      {
        id: 1,
        user_id: 5,
        message: 'Welcome to SmartLab. Your demo account is ready.',
        is_read: false,
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('invoice_payments', null, {});
    await queryInterface.bulkDelete('invoice_items', null, {});
    await queryInterface.bulkDelete('invoices', null, {});
    await queryInterface.bulkDelete('results', null, {});
    await queryInterface.bulkDelete('sample_tests', null, {});
    await queryInterface.bulkDelete('samples', null, {});
    await queryInterface.bulkDelete('tests', null, {});
    await queryInterface.bulkDelete('test_categories', null, {});
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
