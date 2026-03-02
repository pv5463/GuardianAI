@echo off
echo ========================================
echo Guardian AI Engine - Windows Setup
echo ========================================
echo.

echo Step 1: Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    echo Make sure Python is installed and in PATH
    pause
    exit /b 1
)
echo ✓ Virtual environment created
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated
echo.

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
echo ✓ Pip upgraded
echo.

echo Step 4: Installing core dependencies...
pip install numpy pandas joblib
if errorlevel 1 (
    echo ERROR: Failed to install core dependencies
    pause
    exit /b 1
)
echo ✓ Core dependencies installed
echo.

echo Step 5: Installing scikit-learn...
pip install scikit-learn
if errorlevel 1 (
    echo ERROR: Failed to install scikit-learn
    echo.
    echo Try one of these solutions:
    echo 1. Use Python 3.11 instead of 3.13
    echo 2. Install Visual C++ Build Tools
    echo 3. See WINDOWS_SETUP.md for details
    pause
    exit /b 1
)
echo ✓ scikit-learn installed
echo.

echo Step 6: Installing FastAPI and dependencies...
pip install fastapi "uvicorn[standard]" pydantic python-multipart slowapi
if errorlevel 1 (
    echo ERROR: Failed to install FastAPI dependencies
    pause
    exit /b 1
)
echo ✓ FastAPI dependencies installed
echo.

echo Step 7: Training models...
echo Training login model...
python training\train_login_model.py
if errorlevel 1 (
    echo ERROR: Failed to train login model
    pause
    exit /b 1
)
echo ✓ Login model trained
echo.

echo Training URL model...
python training\train_url_model.py
if errorlevel 1 (
    echo ERROR: Failed to train URL model
    pause
    exit /b 1
)
echo ✓ URL model trained
echo.

echo Training SMS model...
python training\train_sms_model.py
if errorlevel 1 (
    echo ERROR: Failed to train SMS model
    pause
    exit /b 1
)
echo ✓ SMS model trained
echo.

echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo To start the server, run:
echo   venv\Scripts\activate
echo   python main.py
echo.
echo To test the API, run (in a new terminal):
echo   venv\Scripts\activate
echo   python test_api.py
echo.
pause
