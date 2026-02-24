#!/bin/bash

echo "========================================="
echo "Felicity Event Management System Setup"
echo "========================================="
echo ""

# Backend Setup
echo "Setting up Backend..."
cd backend
echo "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please update it with your MongoDB URI and other credentials."
fi

cd ..
echo "Backend setup complete!"
echo ""

# Frontend Setup
echo "Setting up Frontend..."
cd frontend
echo "Installing frontend dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
    echo "Created .env.local file"
fi

cd ..
echo "Frontend setup complete!"
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "To start the application:"
echo "1. Terminal 1 - Backend:"
echo "   cd backend && npm start"
echo ""
echo "2. Terminal 2 - Frontend:"
echo "   cd frontend && npm start"
echo ""
echo "Frontend will open at: http://localhost:3000"
echo "Backend API: http://localhost:5000/api"
