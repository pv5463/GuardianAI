@echo off
echo ========================================
echo Guardian AI Engine - Starting Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11 or higher
    pause
    exit /b 1
)

echo Checking for required packages...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Required packages not installed
    echo Please run: pip install -r requirements.txt
    pause
    exit /b 1
)

echo Checking for trained models...
if not exist "models\login_model.pkl" (
    echo WARNING: Models not found. Training models first...
    python train_all_models.py
    if errorlevel 1 (
        echo ERROR: Model training failed
        pause
        exit /b 1
    )
)

echo.
echo Starting Guardian AI Engine on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

python main.py
