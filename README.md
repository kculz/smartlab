# SmartLab Laboratory Management System - v2.0

A modern, scalable laboratory management system built with Node.js, Express, React, and MySQL.

## Project Structure

```
smartlab-v2/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # Database & email config
│   │   ├── models/         # Sequelize models
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & error handling
│   │   ├── services/       # Reusable logic
│   │   ├── utils/          # Helpers (JWT, email, password)
│   │   ├── constants/      # Enums & constants
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Express app entry
│   ├── migrations/         # Database migrations
│   ├── seeders/           # Test data seeders
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── store/         # Zustand state management
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── styles/        # Global styles
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   └── package.json
│
├── database/
│   └── schema.sql         # Database schema
│
└── docs/                  # Documentation
```

## Quick Start

### 1. Database Setup

Create the MySQL database:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## User Roles & Permissions

### 1. **Admin**
- Full system access
- User management
- Test configuration
- System settings
- View all reports

### 2. **Manager**
- View dashboards & analytics
- Department oversight
- Staff management
- Generate revenue reports

### 3. **Doctor**
- Approve tests
- View patient results
- Assign next workflow stages
- Review lab findings

### 4. **Nurse**
- Patient assessment
- Sample collection coordination
- Patient communication

### 5. **Lab Technician**
- Process samples
- Execute tests
- Enter test results
- Manage lab workflow

### 6. **Receptionist**
- Register patients
- Create samples
- Manage payments/invoices
- Check-in coordination

### 7. **Patient/Client**
- Track sample progress
- View results
- Pay invoices
- Receive notifications

## API Documentation

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+263712345678",
  "role": "patient"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**GET /api/auth/profile** (Requires auth)

### Patients

**POST /api/patients**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+263712345678",
  "email": "john@example.com",
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "address": "123 Main St",
  "city": "Harare"
}
```

**GET /api/patients** (Query: search, limit, offset)
**GET /api/patients/:id**
**PUT /api/patients/:id**

### Samples

**POST /api/samples**
```json
{
  "patient_id": 1,
  "test_ids": [1, 2, 3],
  "notes": "Optional notes"
}
```

**GET /api/samples** (Query: status, patient_id, limit, offset)
**GET /api/samples/:id**
**GET /api/samples/track/:sample_id** (Public - no auth)
**PUT /api/samples/:id/status**
```json
{
  "current_status": "In Progress",
  "current_stage": "Lab",
  "notes": "Processing..."
}
```

### Tests

**POST /api/tests** (Admin only)
```json
{
  "test_category_id": 1,
  "name": "Blood Test",
  "description": "General blood analysis",
  "price": 25.00,
  "currency": "USD"
}
```

**GET /api/tests** (Query: category_id, is_active)
**GET /api/tests/:id**
**PUT /api/tests/:id** (Admin only)
**PUT /api/tests/:id/toggle** (Admin only)

### Results

**POST /api/results** (Lab Technician, Admin)
```json
{
  "sample_test_id": 1,
  "value": "Normal",
  "status": "Pending Review"
}
```

**GET /api/results** (Query: sample_test_id, status)
**GET /api/results/:id**
**PUT /api/results/:id**
**PUT /api/results/:id/approve** (Doctor, Admin)

### Invoices

**POST /api/invoices**
```json
{
  "patient_id": 1,
  "test_ids": [1, 2],
  "currency": "USD"
}
```

**GET /api/invoices** (Query: patient_id, status)
**GET /api/invoices/:id**
**PUT /api/invoices/:id/status**
```json
{
  "status": "Paid"
}
```

## Email Configuration

Update the `.env` file with your email provider settings:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@smartlab.local
```

### Using Gmail:
1. Enable 2-Step Verification
2. Generate an App Password
3. Use the App Password in EMAIL_PASSWORD

## Features Implemented

✅ User authentication with JWT  
✅ Role-based access control  
✅ Patient management  
✅ Sample registration & tracking  
✅ Test management  
✅ Result entry & approval  
✅ Invoice generation & payment tracking  
✅ Email notifications  
✅ Multi-currency support (USD, ZWL)  
✅ Responsive UI with Tailwind CSS  
✅ Type-safe with TypeScript  

## Features to Build (Phase 2)

- [ ] Bulk sample operations
- [ ] Advanced reporting & export (PDF, Excel)
- [ ] SMS notifications
- [ ] WebSocket real-time updates
- [ ] Workflow automation & rules engine
- [ ] File attachments for samples
- [ ] User activity audit trail
- [ ] Department-level access control
- [ ] Multi-tenancy support
- [ ] Performance dashboards

## Development Notes

### Database Migrations
```bash
npm run migrate          # Run migrations
npm run migrate:undo     # Undo migrations
npm run seed             # Seed test data
```

### Building for Production
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm preview
```

## Troubleshooting

### Database Connection Failed
- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists: `SHOW DATABASES;`

### CORS Errors
- Check FRONTEND_URL in backend `.env`
- Ensure ports are correct (5000 for backend, 5173 for frontend)

### Email Not Sending
- Verify email credentials
- Check firewall/antivirus blocking SMTP port
- Use Gmail App Password (not regular password)

## Support

For issues or questions, please create an issue in the repository.

## License

MIT License - 2026

# smartlab
