# SmartLab - Role & Permission Matrix

## Role Access Control

| Feature | Admin | Manager | Doctor | Nurse | Lab Tech | Receptionist | Patient |
|---------|-------|---------|--------|-------|----------|--------------|---------|
| **User Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View All Patients** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Register Patients** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Create Samples** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Process Samples** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Enter Results** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Approve Results** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Assign Next Stage** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create Invoices** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **View Invoices** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Record Payments** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View Analytics** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Generate Reports** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Test Configuration** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Track Own Samples** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Own Results** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## API Endpoint Access

### Authentication Endpoints

| Endpoint | Method | Public | Auth Required | Allowed Roles |
|----------|--------|--------|---------------|---------------|
| /api/auth/register | POST | ✅ | ❌ | All |
| /api/auth/login | POST | ✅ | ❌ | All |
| /api/auth/profile | GET | ❌ | ✅ | All |

### Patient Endpoints

| Endpoint | Method | Auth | Allowed Roles |
|----------|--------|------|---------------|
| /api/patients | POST | ✅ | admin, receptionist |
| /api/patients | GET | ✅ | admin, receptionist, doctor, manager |
| /api/patients/:id | GET | ✅ | All authenticated |
| /api/patients/:id | PUT | ✅ | admin, receptionist |

### Sample Endpoints

| Endpoint | Method | Auth | Allowed Roles |
|----------|--------|------|---------------|
| /api/samples | POST | ✅ | admin, receptionist |
| /api/samples | GET | ✅ | admin, receptionist, lab_technician, doctor, manager |
| /api/samples/:id | GET | ✅ | All authenticated |
| /api/samples/:id/status | PUT | ✅ | admin, lab_technician, doctor |
| /api/samples/track/:sample_id | GET | ❌ | Public (for patient tracking) |

### Test Endpoints

| Endpoint | Method | Auth | Allowed Roles |
|----------|--------|------|---------------|
| /api/tests | POST | ✅ | admin |
| /api/tests | GET | ✅ | All authenticated |
| /api/tests/:id | GET | ✅ | All authenticated |
| /api/tests/:id | PUT | ✅ | admin |
| /api/tests/:id/toggle | PUT | ✅ | admin |

### Result Endpoints

| Endpoint | Method | Auth | Allowed Roles |
|----------|--------|------|---------------|
| /api/results | POST | ✅ | admin, lab_technician |
| /api/results | GET | ✅ | admin, lab_technician, doctor, manager |
| /api/results/:id | GET | ✅ | All authenticated |
| /api/results/:id | PUT | ✅ | admin, lab_technician |
| /api/results/:id/approve | PUT | ✅ | admin, doctor |

### Invoice Endpoints

| Endpoint | Method | Auth | Allowed Roles |
|----------|--------|------|---------------|
| /api/invoices | POST | ✅ | admin, receptionist |
| /api/invoices | GET | ✅ | admin, receptionist, manager |
| /api/invoices/:id | GET | ✅ | All authenticated |
| /api/invoices/:id/status | PUT | ✅ | admin, receptionist |

## Role Descriptions

### 1. Admin
- Full system access
- User account management
- Test catalog configuration
- System settings
- View all data
- Generate reports
- Access audit logs

### 2. Manager
- View dashboards
- Department oversight
- Staff supervision
- Revenue reports
- Performance analytics
- Cannot modify patient data

### 3. Doctor
- Approve test results
- View patient profiles
- Review lab findings
- Assign next workflow stages (e.g., to Pharmacy)
- Cannot modify patient registration
- Cannot delete records

### 4. Nurse
- Assist with patient assessment
- Coordinate sample collection
- Update patient information
- Patient communication
- No financial access

### 5. Lab Technician
- Process samples
- Execute laboratory tests
- Enter test results
- Update sample status
- Cannot approve results
- Cannot delete records

### 6. Receptionist
- Register new patients
- Create sample records
- Generate invoices
- Record payments
- Schedule appointments
- Cannot access test/result details

### 7. Patient
- View own sample tracking
- View own results
- View own invoices
- Pay bills online
- Cannot view other patients' data

## Workflow Stages & Access

| Stage | Accessible By | Actions |
|-------|---------------|---------|
| **Reception** | Receptionist | Register, create sample, collect payment |
| **Lab** | Lab Technician | Process sample, run tests, enter results |
| **Doctor Review** | Doctor | Approve results, assign next stage |
| **Pharmacy** | Can be assigned by doctor | Dispense medications |
| **Completed** | Patient | View final results |

## Notification Recipients

- **Patient**: Sample status updates, result availability, payment reminders
- **Receptionist**: New appointments, payment confirmations
- **Lab Tech**: New samples assigned, result request
- **Doctor**: Results pending approval, patient alerts
- **Manager**: Daily summary, revenue updates, performance metrics

## Security Notes

1. Passwords are bcrypt hashed
2. JWT tokens expire after 24 hours
3. API calls require valid Bearer token
4. Role validation happens on both frontend and backend
5. All database queries filtered by user role
6. Audit logs track all administrative actions
7. Email notifications for sensitive operations

## Future Enhancements

- [ ] Two-factor authentication for sensitive roles
- [ ] Department-level access control
- [ ] Custom role creation
- [ ] Fine-grained permissions system
- [ ] API key authentication for integrations
- [ ] Activity-based alerts
