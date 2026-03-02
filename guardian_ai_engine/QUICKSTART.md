# Guardian AI Engine - Quick Start

## Windows Users - Easy Setup

### Method 1: Automated Installation (Recommended)

Simply double-click `install_windows.bat` and it will:
- Create virtual environment
- Install all dependencies
- Train all models
- Set everything up automatically

Then to start the server, double-click `start_server.bat`

### Method 2: Manual Installation

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate

# 2. Upgrade pip
python -m pip install --upgrade pip

# 3. Install dependencies (one by one for better compatibility)
pip install numpy pandas joblib
pip install scikit-learn
pip install fastapi "uvicorn[standard]" pydantic python-multipart slowapi

# 4. Train models
python training\train_login_model.py
python training\train_url_model.py
python training\train_sms_model.py

# 5. Start server
python main.py
```

### Method 3: Use Docker (No Python issues)

```bash
docker-compose up --build
```

## Testing the API

Once the server is running, open a new terminal:

```bash
cd guardian_ai_engine
venv\Scripts\activate
python test_api.py
```

Or use the batch file: double-click `run_tests.bat`

## Common Issues

### "Microsoft Visual C++ 14.0 required"

**Solution 1 (Easiest):** Use Python 3.11 instead of 3.13
- Download from https://www.python.org/downloads/release/python-3119/
- Reinstall and try again

**Solution 2:** Install pre-built wheels
```bash
pip install --only-binary :all: scikit-learn
```

**Solution 3:** Install Visual C++ Build Tools
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Install "Desktop development with C++"

### "No module named 'pandas'"

Make sure virtual environment is activated:
```bash
venv\Scripts\activate
pip install pandas numpy joblib scikit-learn
```

### "Could not connect to server"

The server must be running in another terminal:
```bash
# Terminal 1
python main.py

# Terminal 2 (new window)
python test_api.py
```

### Port 8000 already in use

```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## API Endpoints

Once running, visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Root: http://localhost:8000/

## Example API Calls

### Login Threat Detection
```bash
curl -X POST http://localhost:8000/predict/login ^
  -H "Content-Type: application/json" ^
  -d "{\"failed_attempts\": 5, \"country_changed\": true, \"role_access_attempt\": 2, \"login_gap_minutes\": 3}"
```

### URL Phishing Detection
```bash
curl -X POST http://localhost:8000/predict/url ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"http://paypal-verify.tk/login\"}"
```

### SMS Scam Detection
```bash
curl -X POST http://localhost:8000/predict/sms ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"URGENT! Your bank account suspended. Click here now!\"}"
```

## Next Steps

1. Check `README.md` for full API documentation
2. Check `DEPLOYMENT.md` for production deployment
3. Check `WINDOWS_SETUP.md` for detailed Windows troubleshooting

## Integration with Next.js Frontend

Add to your `.env.local`:
```
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000
```

Then use the API from your Next.js app:
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_AI_ENGINE_URL}/predict/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
});
const result = await response.json();
```
