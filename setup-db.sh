#!/bin/bash

# SmartLab - Database Setup Script
# This script creates the MySQL database and tables for SmartLab

echo "🏗️  SmartLab Database Setup"
echo "============================"
echo ""

# Check if MySQL is running
if ! mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo "❌ MySQL is not running or root user has a password set"
    echo ""
    echo "For XAMPP on macOS:"
    echo "1. Open XAMPP Control Panel"
    echo "2. Click 'Start' next to MySQL"
    echo ""
    echo "Or start from terminal:"
    echo "  /Applications/XAMPP/bin/mysql.server start"
    echo ""
    exit 1
fi

echo "✅ MySQL is running"
echo ""

# Create database
echo "📝 Creating database 'smartlab_db'..."
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS smartlab_db;
USE smartlab_db;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database created"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Import schema
echo "📋 Importing schema..."
if [ -f "database/schema.sql" ]; then
    mysql -u root smartlab_db < database/schema.sql
    if [ $? -eq 0 ]; then
        echo "✅ Schema imported"
    else
        echo "❌ Failed to import schema"
        exit 1
    fi
else
    echo "❌ schema.sql not found in database/ directory"
    exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Database Statistics:"
mysql -u root smartlab_db << 'EOF'
SELECT 
    'Total Tables' as Info,
    COUNT(*) as Count
FROM information_schema.tables 
WHERE table_schema = 'smartlab_db';
EOF

echo ""
echo "🚀 Next steps:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev (in another terminal)"
echo "3. Open http://localhost:5173 in your browser"
echo "4. Login or create a test account"
echo ""
