# SmartLab - Setup Instructions

## Prerequisites

- Node.js 18+ (Download from nodejs.org)
- MySQL 5.7+ (XAMPP includes MySQL)
- npm (comes with Node.js)

## Step 1: Clone/Download Project

Project is located at: `/Applications/XAMPP/xamppfiles/htdocs/smartlab-v2`

## Step 2: Start MySQL

### macOS with XAMPP:
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Verify it's running (should say "Running")

### Or via terminal:
```bash
/Applications/XAMPP/bin/mysql.server start
```

## Step 3: Create Database

```bash
# Connect to MySQL
mysql -u root

# Create database
CREATE DATABASE smartlab_db;
EXIT;

# Import schema
mysql -u root smartlab_db < /Applications/XAMPP/xamppfiles/htdocs/smartlab-v2/database/schema.sql
```

Verify tables were created:
```bash
mysql -u root smartlab_db -e "SHOW TABLES;"
```

## Step 4: Backend Setup

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/smartlab-v2/backend

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Update these values:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=smartlab_db
DB_USER=root
DB_PASSWORD=

PORT=5000
JWT_SECRET=your-super-secret-key-change-this
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_ENABLED=true
EMAIL_TRANSPORT=smtp
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@smartlab.local
FRONTEND_URL=http://localhost:5173
```

On Windows, if `localhost` gives you a connection error, change `DB_HOST` to `127.0.0.1`.

Install dependencies and start:
```bash
npm install
npm run dev
```

✅ Backend should be running on http://localhost:5000

## Step 5: Frontend Setup

In a new terminal:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/smartlab-v2/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend should be running on http://localhost:5173

## Step 6: Test the System

1. Open browser: http://localhost:5173
2. Register a new account or login with test credentials
3. Try different user roles to see role-based views

## Test User Credentials (After First Setup)

You can create test users via the registration page.

## Common Issues & Solutions

### Port Already in Use

If port 5000 or 5173 is in use:

**Kill the process:**
```bash
# macOS
lsof -i :5000
kill -9 <PID>

# For port 5173
lsof -i :5173
kill -9 <PID>
```

**Or use different ports:**
- Backend: Change PORT in .env
- Frontend: Modify vite.config.ts server.port

### MySQL Connection Refused

```bash
# Start MySQL
/Applications/XAMPP/bin/mysql.server start

# Check if running
/Applications/XAMPP/bin/mysql.server status

# Restart if needed
/Applications/XAMPP/bin/mysql.server restart
```

### npm ERR! ERESOLVE unable to resolve dependency tree

```bash
# Ignore peer dependency conflicts
npm install --legacy-peer-deps
```

### Email Not Sending

If using Gmail:
1. Enable 2-Step Verification in Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not regular password) in .env

For local development, you can skip SMTP entirely by setting:
```env
EMAIL_ENABLED=false
```
or render messages to the console instead of sending them:
```env
EMAIL_TRANSPORT=console
```

If SMTP auth still fails with `535 Incorrect authentication data`, the backend will keep patient, reception, lab, and doctor workflows running, but you still need valid SMTP credentials for real email delivery.

To test the SMTP connection from the backend, run:
```bash
cd backend
npm run test:email
```

To also send a real test message, provide a recipient:
```bash
npm run test:email -- --to your-email@example.com
```

To force the SSL port while testing:
```bash
npm run test:email -- --port 465 --secure true --to your-email@example.com
```

## Next Steps

1. **Create Test Data**: Register users with different roles
2. **Test Workflows**: 
   - Patient: Register, track sample
   - Receptionist: Create sample, generate invoice
   - Lab Tech: Enter results
   - Doctor: Approve results
3. **Configure Tests**: Admin panel to add test categories and tests
4. **Email Setup**: Configure your email provider in .env

## File Structure Reference

```
/Applications/XAMPP/xamppfiles/htdocs/smartlab-v2/
├── backend/          # Express API (runs on 5000)
├── frontend/         # React app (runs on 5173)
├── database/         # MySQL schema
├── docs/            # Documentation
└── README.md        # This file
```

## Running Both Servers

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd frontend && npm run dev
```

Both should start without errors. Keep both running while developing.

## Database Backup

```bash
# Backup database
mysqldump -u root smartlab_db > backup.sql

# Restore from backup
mysql -u root smartlab_db < backup.sql
```

## Need Help?

Check the logs:
- Backend: Terminal output (npm run dev)
- Frontend: Browser console (F12)
- Database: Check MySQL is running and accessible

That's it! Your SmartLab system is now running locally. 🚀
