# Guardian AI Threat Detection Engine

Production-ready Python AI engine for cybersecurity threat detection with FastAPI REST APIs.

## Features

- **Login Anomaly Detection**: Detects brute force, impossible travel, and privilege abuse
- **Phishing URL Classification**: Identifies malicious URLs with explainable features
- **SMS Scam Detection**: Classifies SMS messages for scam patterns
- **Real-time Inference**: < 200ms response time
- **Explainable AI**: Clear reasoning for all predictions
- **Rate Limited**: 100 requests/minute per endpoint
- **CORS Enabled**: Ready for frontend integration

## Quick Start

### Windows Users - READ THIS FIRST! 🪟

If you're on Windows and getting errors, see `FIX_YOUR_ISSUE.md` or just run:
```bash
install_windows.bat
```

This will automatically set everything up for you.

### 1. Install Dependencies

**Windows (Recommended):**
```bash
cd guardian_ai_engine
# Use Python 3.11, not 3.13
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements-windows.txt
```

**Linux/Mac:**
```bash
cd guardian_ai_engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Train Models

```bash
# Train all models
python training/train_login_model.py
python training/train_url_model.py
python training/train_sms_model.py
```

### 3. Start Server

```bash
# Development
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server runs at: `http://localhost:8000`

## API Endpoints

### Health Check
```bash
GET /health
```

### Login Threat Detection
```bash
POST /predict/login
Content-Type: application/json

{
  "failed_attempts": 5,
  "country_changed": true,
  "role_access_attempt": 2,
  "login_gap_minutes": 3
}
```

**Response:**
```json
{
  "risk_score": 78.5,
  "risk_level": "High",
  "classification": "brute_force",
  "explanation": [
    "Multiple failed login attempts detected",
    "Suspicious rapid login attempts"
  ],
  "incident_required": true,
  "probability": 0.785
}
```

### URL Phishing Detection
```bash
POST /predict/url
Content-Type: application/json

{
  "url": "http://paypal-verify.tk/login"
}
```

**Response:**
```json
{
  "risk_score": 85.0,
  "risk_level": "High",
  "classification": "phishing",
  "explanation": [
    "No HTTPS encryption",
    "Suspicious domain extension",
    "Contains brand impersonation keywords"
  ],
  "incident_required": true
}
```

### SMS Scam Detection
```bash
POST /predict/sms
Content-Type: application/json

{
  "text": "URGENT! Your bank account suspended. Click here now!"
}
```

**Response:**
```json
{
  "risk_score": 92.3,
  "risk_level": "High",
  "classification": "scam",
  "explanation": [
    "urgency: 'urgent'",
    "banking: 'bank'",
    "banking: 'account'",
    "contains suspicious link"
  ],
  "incident_required": true,
  "probability": 0.923
}
```

## Risk Scoring

- **0-30**: Low Risk
- **31-60**: Medium Risk
- **61-100**: High Risk (triggers `incident_required: true`)

## Architecture

```
guardian_ai_engine/
├── main.py                    # FastAPI server
├── requirements.txt           # Dependencies
├── models/                    # Trained models (generated)
│   ├── login_model.pkl
│   ├── url_model.pkl
│   └── sms_model.pkl
├── utils/
│   └── feature_extraction.py # Feature engineering
└── training/
    ├── train_login_model.py
    ├── train_url_model.py
    └── train_sms_model.py
```

## Performance

- Inference time: < 200ms per request
- Lightweight models suitable for small deployments
- No GPU required
- Memory footprint: < 100MB

## Security Features

- Input validation with Pydantic
- Rate limiting (100 req/min)
- CORS configuration
- No SQL injection vectors
- Proper error handling

## Integration Example

```python
import requests

# Login threat check
response = requests.post(
    "http://localhost:8000/predict/login",
    json={
        "failed_attempts": 3,
        "country_changed": False,
        "role_access_attempt": 0,
        "login_gap_minutes": 120
    }
)
result = response.json()
print(f"Risk: {result['risk_level']} - {result['classification']}")
```

## Model Details

- **Algorithm**: Logistic Regression (scikit-learn)
- **Training**: Synthetic labeled datasets
- **Features**: Structured numerical features
- **Explainability**: Feature importance weights
- **Persistence**: joblib serialization

## Production Deployment

```bash
# Using Docker
docker build -t guardian-ai-engine .
docker run -p 8000:8000 guardian-ai-engine

# Using systemd
sudo systemctl start guardian-ai-engine

# Using PM2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name guardian-ai
```

## Environment Variables

```bash
# Optional configuration
export GUARDIAN_AI_PORT=8000
export GUARDIAN_AI_WORKERS=4
export GUARDIAN_AI_LOG_LEVEL=info
```

## License

MIT License - Guardian AI Cybersecurity System
