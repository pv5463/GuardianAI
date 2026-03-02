# Fix Your Installation Issue - Step by Step

## Your Current Problem

You're getting "Microsoft Visual C++ 14.0 required" because Python 3.13 is very new and scikit-learn doesn't have pre-built wheels for it yet on Windows.

## Solution: Use These Exact Commands

### Step 1: Clean Up (if you tried installing before)

```bash
cd guardian_ai_engine

# Remove old virtual environment if it exists
rmdir /s /q venv

# Or if using PowerShell:
Remove-Item -Recurse -Force venv
```

### Step 2: Check Your Python Version

```bash
python --version
```

**If you see Python 3.13.x:**
- Download Python 3.11.9 from: https://www.python.org/downloads/release/python-3119/
- Install it
- Make sure to check "Add Python to PATH"
- Restart your terminal
- Run `py -3.11 --version` to verify

### Step 3: Create Virtual Environment with Python 3.11

```bash
# If you have Python 3.11 installed
py -3.11 -m venv venv

# Or if Python 3.11 is your default
python -m venv venv
```

### Step 4: Activate Virtual Environment

```bash
# PowerShell
venv\Scripts\Activate.ps1

# CMD
venv\Scripts\activate.bat
```

You should see `(venv)` at the start of your command prompt.

### Step 5: Upgrade pip

```bash
python -m pip install --upgrade pip
```

### Step 6: Install Packages One by One

```bash
# Install core packages first
pip install numpy
pip install pandas
pip install joblib

# Install scikit-learn
pip install scikit-learn

# Install web framework
pip install fastapi
pip install "uvicorn[standard]"
pip install pydantic
pip install python-multipart
pip install slowapi
```

### Step 7: Verify Installation

```bash
python -c "import sklearn; print('scikit-learn:', sklearn.__version__)"
python -c "import pandas; print('pandas:', pandas.__version__)"
python -c "import fastapi; print('fastapi:', fastapi.__version__)"
```

All should print version numbers without errors.

### Step 8: Train Models

```bash
python training\train_login_model.py
python training\train_url_model.py
python training\train_sms_model.py
```

You should see:
- "Dataset saved: 1000 samples"
- "Model saved to models/login_model.pkl"
- Similar messages for URL and SMS models

### Step 9: Start Server

```bash
python main.py
```

You should see:
```
✓ Login model loaded
✓ URL model loaded
✓ SMS model loaded
Guardian AI Engine ready
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 10: Test API (Open New Terminal)

```bash
cd guardian_ai_engine
venv\Scripts\activate
python test_api.py
```

## Alternative: Use the Automated Script

Just double-click `install_windows.bat` and it will do everything automatically.

## Still Having Issues?

### Issue: "py -3.11 not found"

You don't have Python 3.11 installed. Either:
1. Install Python 3.11.9 from python.org
2. Or install Visual C++ Build Tools (7GB download)

### Issue: "pip install scikit-learn" still fails

Try installing from pre-built wheel:
```bash
pip install --only-binary :all: scikit-learn
```

Or use conda instead:
```bash
conda create -n guardian python=3.11
conda activate guardian
conda install scikit-learn pandas numpy fastapi uvicorn
pip install slowapi python-multipart
```

### Issue: "Could not connect to server"

Make sure server is running:
```bash
# Terminal 1 - Start server
cd guardian_ai_engine
venv\Scripts\activate
python main.py

# Terminal 2 - Test API (NEW WINDOW)
cd guardian_ai_engine
venv\Scripts\activate
python test_api.py
```

### Issue: Port 8000 already in use

```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill that process (replace <PID> with actual number)
taskkill /PID <PID> /F
```

### Issue: "No module named 'pandas'" even after installing

Your virtual environment isn't activated:
```bash
# Make sure you see (venv) in your prompt
venv\Scripts\activate

# Then try again
python main.py
```

## Nuclear Option: Use Docker

If nothing works, use Docker to avoid all Python issues:

1. Install Docker Desktop for Windows
2. Run:
```bash
cd guardian_ai_engine
docker-compose up --build
```

Done! Server runs at http://localhost:8000

## Need More Help?

Check these files:
- `QUICKSTART.md` - Quick start guide
- `WINDOWS_SETUP.md` - Detailed Windows setup
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Production deployment

## Summary of What You Need

1. Python 3.11 (not 3.13)
2. Virtual environment activated
3. Packages installed in correct order
4. Models trained
5. Server running

Follow the steps above exactly and it will work!
