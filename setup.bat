@echo off
echo =========================================
echo Felicity Event Management System Setup
echo =========================================
echo.

REM Backend Setup
echo Setting up Backend...
cd backend
echo Installing backend dependencies...
call npm install

REM Create .env file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please update it with your MongoDB URI and other credentials.
)

cd ..
echo Backend setup complete!
echo.

REM Frontend Setup
echo Setting up Frontend...
cd frontend
echo Installing frontend dependencies...
call npm install

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo REACT_APP_API_URL=http://localhost:5000/api > .env.local
    echo Created .env.local file
)

cd ..
echo Frontend setup complete!
echo.

echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo To start the application:
echo 1. Terminal 1 - Backend:
echo    cd backend ^&^& npm start
echo.
echo 2. Terminal 2 - Frontend:
echo    cd frontend ^&^& npm start
echo.
echo Frontend will open at: http://localhost:3000
echo Backend API: http://localhost:5000/api
