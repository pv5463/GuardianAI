# Windows Setup Guide for Guardian AI Engine

## Quick Fix for Python 3.13 on Windows

If you're getting the "Microsoft Visual C++ 14.0 or greater is required" error, follow these steps:

### Option 1: Use Python 3.11 (Recommended)

Python 3.13 is very new and some packages don't have pre-built wheels yet. Use Python 3.11 instead:

1. Download Python 3.11 from https://www.python.org/downloads/
2. Install it
3. Create virtual environment:
```bash
py -3.11 -m venv venv
venv\Scripts\activate
```

### Option 2: Install Pre-built Wheels

Install packages one by one to use pre-built wheels:

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install packages individually
pip install numpy
pip install pandas
pip install joblib
pip install scikit-learn
pip install fastapi
pip install "uvicorn[standard]"
pip install pydantic
pip install python-multipart
pip install slowapi
```

### Option 3: Install Visual C++ Build Tools (If needed)

If you must use Python 3.13:

1. Download Microsoft C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run installer
3. Select "Desktop development with C++"
4. Install (requires ~7GB)
5. Restart terminal
6. Run: `pip install -r requirements.txt`

## Complete Setup Steps

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install packages
pip install numpy pandas joblib
pip install scikit-learn
pip install fastapi "uvicorn[standard]" pydantic python-multipart slowapi
```

### 3. Train Models
```bash
python training\train_login_model.py
python training\train_url_model.py
python training\train_sms_model.py
```

### 4. Start Server
```bash
python main.py
```

### 5. Test API (in new terminal)
```bash
cd guardian_ai_engine
venv\Scripts\activate
python test_api.py
```

## Troubleshooting

### "No module named 'pandas'"
```bash
venv\Scripts\activate
pip install pandas numpy joblib scikit-learn
```

### "Could not connect to server"
Make sure the server is running:
```bash
# Terminal 1
python main.py

# Terminal 2 (new window)
python test_api.py
```

### Port 8000 already in use
```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Import errors
```bash
# Reinstall all dependencies
pip uninstall -y fastapi uvicorn pydantic scikit-learn pandas numpy joblib
pip install numpy pandas joblib scikit-learn fastapi "uvicorn[standard]" pydantic python-multipart slowapi
```

## Verify Installation

```bash
python -c "import sklearn; print(sklearn.__version__)"
python -c "import pandas; print(pandas.__version__)"
python -c "import numpy; print(numpy.__version__)"
python -c "import fastapi; print(fastapi.__version__)"
```

All should print version numbers without errors.

## Alternative: Use Docker

If you continue having issues, use Docker instead:

```bash
# Install Docker Desktop for Windows
# Then run:
docker-compose up --build
```

This avoids all Python environment issues.
