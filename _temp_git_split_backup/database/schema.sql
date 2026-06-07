-- Create database
CREATE DATABASE IF NOT EXISTS smartlab_db;
USE smartlab_db;

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'receptionist', 'lab_technician', 'doctor', 'nurse', 'manager', 'patient') DEFAULT 'patient',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  dashboard_label VARCHAR(100),
  default_route VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  address VARCHAR(255),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
);

-- Test Categories Table
CREATE TABLE test_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tests Table
CREATE TABLE tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(14, 2) NOT NULL,
  currency ENUM('USD', 'ZWL') DEFAULT 'USD',
  unit VARCHAR(100) COMMENT 'Measurement unit e.g. mmol/L, g/dL',
  reference_range VARCHAR(200) COMMENT 'Normal range e.g. 3.5–5.0 mmol/L',
  turnaround_hours INT COMMENT 'Expected TAT in hours',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_category_id) REFERENCES test_categories(id) ON DELETE CASCADE,
  INDEX idx_category (test_category_id)
);

-- Samples Table
CREATE TABLE samples (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sample_id VARCHAR(50) UNIQUE NOT NULL,
  patient_id INT NOT NULL,
  registered_by INT NOT NULL,
  specimen_type ENUM('Blood', 'Urine', 'Stool', 'Swab', 'Sputum', 'Saliva', 'Tissue', 'Other') DEFAULT 'Blood',
  priority ENUM('Routine', 'Urgent', 'STAT') DEFAULT 'Routine',
  current_status ENUM('Pending', 'In Progress', 'Completed', 'Reported', 'Released') DEFAULT 'Pending',
  current_stage ENUM('Reception', 'Lab', 'Doctor Review', 'Pharmacy', 'Completed') DEFAULT 'Reception',
  notes TEXT,
  collected_at TIMESTAMP NULL COMMENT 'When specimen was physically collected — for TAT calculation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_patient (patient_id),
  INDEX idx_status (current_status),
  INDEX idx_stage (current_stage),
  INDEX idx_sample_id (sample_id)
);

-- Sample Tests Table (many-to-many)
CREATE TABLE sample_tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sample_id INT NOT NULL,
  test_id INT NOT NULL,
  status ENUM('Pending', 'In Progress', 'Completed', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_sample_test (sample_id, test_id),
  INDEX idx_test (test_id)
);

-- Results Table
CREATE TABLE results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sample_test_id INT NOT NULL,
  value VARCHAR(500) NOT NULL,
  unit VARCHAR(100) COMMENT 'Measurement unit e.g. mmol/L',
  reference_range VARCHAR(200) COMMENT 'Reference range at time of capture',
  interpretation ENUM('Normal', 'Abnormal', 'Borderline', 'Critical', 'Inconclusive') COMMENT 'Lab tech flag',
  doctor_note TEXT COMMENT 'Doctor note on approval or rejection',
  status ENUM('Normal', 'Abnormal', 'Pending Review', 'Rejected') DEFAULT 'Pending Review',
  approved_by INT COMMENT 'User ID of approving doctor',
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sample_test_id) REFERENCES sample_tests(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sample_test (sample_test_id),
  INDEX idx_status (status),
  INDEX idx_approved_by (approved_by)
);

-- Invoices Table
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INT NOT NULL,
  total_amount DECIMAL(14, 2) DEFAULT 0.00,
  amount_paid DECIMAL(14, 2) DEFAULT 0.00,
  balance_due DECIMAL(14, 2) DEFAULT 0.00,
  currency ENUM('USD', 'ZWL') NOT NULL,
  status ENUM('Pending', 'Partially Paid', 'Paid', 'Cancelled') DEFAULT 'Pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_status (status),
  INDEX idx_invoice_number (invoice_number)
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  test_id INT NOT NULL,
  price DECIMAL(14, 2) NOT NULL,
  currency ENUM('USD', 'ZWL') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE RESTRICT,
  INDEX idx_invoice (invoice_id)
);

-- Invoice Payments Table
CREATE TABLE invoice_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  payment_method ENUM('Cash', 'Card', 'Mobile Money', 'Bank Transfer') NOT NULL,
  amount_tendered DECIMAL(14, 2) NOT NULL,
  amount_applied DECIMAL(14, 2) NOT NULL,
  change_given DECIMAL(14, 2) DEFAULT 0.00,
  reference_number VARCHAR(120),
  notes TEXT,
  received_by INT,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_invoice_payment_invoice (invoice_id),
  INDEX idx_invoice_payment_received_by (received_by)
);

-- Notifications Table
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_action (action_type),
  INDEX idx_created (created_at)
);

-- Create indexes for common queries
CREATE INDEX idx_sample_created ON samples(created_at);
CREATE INDEX idx_invoice_created ON invoices(created_at);
CREATE INDEX idx_patient_created ON patients(created_at);
