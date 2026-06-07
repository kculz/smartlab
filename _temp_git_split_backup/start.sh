#!/bin/bash

# SmartLab Project - Quick Start Script

echo "🚀 SmartLab - Quick Start Setup"
echo "==============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v)"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found in PATH. Please ensure MySQL is running."
    echo "   For XAMPP: Start MySQL from XAMPP Control Panel"
else
    echo "✅ MySQL found"
fi

echo ""
echo "📋 Setup Steps:"
echo "1. Start MySQL (if not already running)"
echo "2. Create database: mysql -u root < database/schema.sql"
echo "3. Start Backend: cd backend && npm run dev"
echo "4. Start Frontend: cd frontend && npm run dev (in another terminal)"
echo ""
echo "🌐 URLs:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: docs/SETUP.md"
echo "   - Role Matrix: docs/ROLES.md"
echo "   - API Docs:    README.md"
echo ""
echo "✅ System ready! Follow the setup steps above to get started."
