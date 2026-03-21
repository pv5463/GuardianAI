# 🛡️ GuardianAI - AI-Powered Cybersecurity Platform

> Enterprise-grade cybersecurity platform with Python AI Engine, real-time threat detection, and automated incident response.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

## 🧪 Quick Start & Testing

### ⚠️ Getting "Service Unavailable" Error?
**The AI Engine is not running!** → See [AI_ENGINE_START_GUIDE.md](./AI_ENGINE_START_GUIDE.md)

### Step 1: Start AI Engine (Terminal 1)
```bash
cd guardian_ai_engine
python main.py
```
Wait for: `✓ Login model loaded` `✓ URL model loaded` `✓ SMS model loaded`

**Verify:** `curl http://localhost:8000/health` should return `{"status":"healthy"}`

### Step 2: Start Frontend (Terminal 2)
```bash
npm run dev
```
Visit: **http://localhost:3000**

### Step 3: Test URL/SMS Analysis with AI Engine

**Test URL Analysis:**
1. **Login/Signup** at http://localhost:3000
2. Go to **Dashboard**
3. Click **URL** tab
4. Enter fake URL: `http://paypal-secure-login.tk/verify`
5. Click **Analyze**
6. **Open Console (F12)** - you'll see:
   ```
   🔍 Analyzing URL: http://paypal-secure-login.tk/verify
   👤 User ID: your-user-id
   🔌 Checking AI Engine health...
   💚 AI Engine healthy: true
   🚀 Calling AI Engine for URL analysis...
   ✅ AI Engine response: {risk_score: 85, ...}
   ```
7. Look for **"AI Engine"** badge on result card

**Test SMS/Text Analysis:**
1. Click **Text** tab
2. Enter: `URGENT! Your bank account will be locked. Click: http://bit.ly/xyz`
3. Click **Analyze**
4. Check console for AI Engine logs
5. Verify **"AI Engine"** badge appears

**Test Login Threat Detection:**
1. Go to `/login`
2. Try wrong password 5-6 times
3. Check console: `Multiple failed login attempts detected...`
4. View `/dashboard/threats` and `/dashboard/incidents`

### Expected Behavior
| Scenario | Result |
|----------|--------|
| AI Engine running + logged in | Shows "AI Engine" badge |
| AI Engine stopped | Uses local analysis (no badge) |
| Not logged in | Uses local analysis (no badge) |
| 3-4 failed logins | AI analyzes, creates threat log |
| 5+ failed logins | Account locked, incident created |

### Diagnostics
```bash
# Check AI Engine health
curl http://localhost:8000/health

# Test typosquatting detection
node demo_typosquatting.js

# Test URL endpoint directly
curl -X POST http://localhost:8000/predict/url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://googl.com"}'

# Run automated tests
node test_threat_detection.js

# Run full diagnostics
node diagnose_threat_detection.js
```

📖 **Quick Test Guide**: See [QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md) for detailed testing
📖 **Advanced Detection**: See [ADVANCED_PHISHING_DETECTION.md](./ADVANCED_PHISHING_DETECTION.md)
📖 **Fix Summary**: See [AI_ENGINE_FIX_SUMMARY.md](./AI_ENGINE_FIX_SUMMARY.md) for implementation details

---

## 🎯 Problem Statement

- **95% increase** in phishing attacks in 2024
- **₹50,000 Cr+** lost to digital scams in India annually
- **Deepfake scams** targeting individuals and organizations
- **Lack of real-time** AI-powered threat detection
- **Manual incident response** causing delayed reactions

---

## 💡 Solution

**GuardianAI** combines Next.js frontend with Python AI Engine backend for intelligent threat detection:

1. **Python AI Engine** - FastAPI backend with scikit-learn models
2. **Real-time Analysis** - Login threats, phishing URLs, SMS scams
3. **Automatic Storage** - User-specific data in Supabase
4. **Real-time Updates** - WebSocket subscriptions
5. **Incident Automation** - Auto-creates incidents for high-risk threats

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3000)              │
│  • User Interface  • Real-time Updates  • Data Visualization│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI Engine Client (TypeScript)               │
│  • API Integration  • Automatic Storage  • Fallback Logic   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Python AI Engine (Port 8000)                    │
│  • FastAPI Server  • Scikit-learn Models  • < 200ms Response│
│  • Login Detection  • URL Analysis  • SMS Scam Detection    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                       │
│  • User Data  • Threat Logs  • Incidents  • Real-time Sync  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 🤖 Advanced Phishing Detection (NEW!)

**Production-grade multi-layer URL security:**

- **Typosquatting Detection** - Catches googl.com, paypa1.com, facebok.com
- **Levenshtein Distance** - Character-level similarity analysis
- **100+ Trusted Domains** - Google, Facebook, Banks, Payment services
- **Fuzzy Matching** - 91% similarity = PHISHING DETECTED
- **Pattern Analysis** - IP addresses, suspicious TLDs, keywords
- **Risk Scoring** - Multi-layer 0-100 scoring system

**Test Results:**
| URL | Detection | Status |
|-----|-----------|--------|
| google.com | ✓ SAFE | 0/100 |
| googl.com | 🚨 TYPOSQUATTING | 70/100 |
| paypa1.com | 🚨 TYPOSQUATTING | 60/100 |
| facebook-login.tk | ⚠️ SUSPICIOUS | 65/100 |

📖 **Full Details**: [ADVANCED_PHISHING_DETECTION.md](./ADVANCED_PHISHING_DETECTION.md)

### 🤖 Python AI Engine

**Production-ready FastAPI backend with machine learning models:**

- **Login Threat Detection** - Brute force, impossible travel, privilege abuse
- **Phishing URL Classification** - Domain analysis, brand impersonation
- **SMS Scam Detection** - Urgency tactics, financial pressure, OTP requests
- **< 200ms Response Time** - Real-time inference
- **Explainable AI** - Clear reasoning for all predictions
- **Auto-scaling** - Handles high traffic

### 🔄 Real-time Integration

**Automatic data flow with user-specific storage:**

- **User UUID Tracking** - All data linked to authenticated users
- **Automatic Storage** - Results saved to Supabase instantly
- **Real-time Updates** - WebSocket subscriptions for live UI updates
- **Incident Creation** - Auto-generates incidents for high-risk threats
- **Historical Tracking** - Complete analysis history per user

### 🎤 Audio & Image Analysis

**No API keys required for core features:**

- **Live Audio Transcription** - Web Speech API (Chrome/Edge)
- **Image OCR** - Tesseract.js (browser-based)
- **AI Voice Detection** - Identifies deepfakes
- **Scam Pattern Analysis** - Urgency, authority, financial pressure

### 🛡️ Security Features

- **AES-256-GCM Encryption** - Secure vault for sensitive data
- **Row Level Security** - Database-level access control
- **Role-Based Access** - Admin, Analyst, Staff roles
- **Device Fingerprinting** - Unique device identification
- **Session Management** - Active session monitoring

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Supabase Client** - Real-time subscriptions

### AI Engine (Backend)
- **Python 3.11** - Core language
- **FastAPI** - High-performance API framework
- **Scikit-learn** - Machine learning models
- **Pandas & NumPy** - Data processing
- **Uvicorn** - ASGI server

### Database & Storage
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Real-time Subscriptions** - WebSocket updates
- **Row Level Security** - User-specific data isolation

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- Python 3.11
- Supabase account

### Step 1: Clone Repository

```bash
git clone https://github.com/pv5463/GuardianAI.git
cd guardian-ai
```

### Step 2: Setup AI Engine

```bash
cd guardian_ai_engine

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train models (one-time)
python train_all_models.py

# Start AI Engine
python main.py
```

AI Engine runs at: **http://localhost:8000**

### Step 3: Setup Frontend

```bash
# In project root
npm install

# Configure environment
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# AI Engine
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000

# Optional: OpenAI Whisper (for uploaded audio transcription)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key
```

### Step 4: Setup Database

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `supabase-guardianai-migration.sql`
3. Paste and execute

### Step 5: Start Frontend

```bash
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🎮 Usage

### For End Users

1. **Sign Up** - Create account with email/password
2. **Dashboard** - Access all analysis tools
3. **Analyze Content** - Text, URLs, screenshots, audio
4. **View Threats** - Real-time threat feed
5. **Track Incidents** - Monitor security incidents
6. **Secure Vault** - Store encrypted notes

### AI Engine API

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Login Threat Detection:**
```bash
curl -X POST http://localhost:8000/predict/login \
  -H "Content-Type: application/json" \
  -d '{
    "failed_attempts": 5,
    "country_changed": true,
    "role_access_attempt": 2,
    "login_gap_minutes": 3
  }'
```

**URL Phishing Detection:**
```bash
curl -X POST http://localhost:8000/predict/url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypal-verify.tk/login"}'
```

**SMS Scam Detection:**
```bash
curl -X POST http://localhost:8000/predict/sms \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT! Your bank account suspended. Click here now!"}'
```

### Integration Example

```typescript
import { analyzeText } from '@/lib/scamDetectionIntegrated';
import { getCurrentUser } from '@/lib/auth';

// Analyze with AI Engine (auto-stores in Supabase)
const user = await getCurrentUser();
const result = await analyzeText(messageText, user?.id);

console.log('Risk Score:', result.score);
console.log('AI Engine Used:', result.aiEngineUsed);
// Data automatically stored in Supabase!
```

---

## 📊 AI Engine Models

### Login Anomaly Detection
- **Algorithm:** Logistic Regression
- **Features:** Failed attempts, country change, role access, login gap
- **Accuracy:** 95%+
- **Output:** Risk score, threat classification, explanation

### URL Phishing Detection
- **Algorithm:** Logistic Regression + Feature Engineering
- **Features:** HTTPS, domain length, TLD, brand keywords, subdomains
- **Accuracy:** 92%+
- **Output:** Safe/Phishing classification, risk score, reasons

### SMS Scam Detection
- **Algorithm:** Logistic Regression + Text Features
- **Features:** Urgency words, money keywords, OTP requests, links
- **Accuracy:** 94%+
- **Output:** Scam probability, detected tactics, recommendations

---

## 🔄 Real-time Data Flow

### Automatic User Data Management

```typescript
// 1. User signs up → UUID created
// 2. User analyzes content → AI Engine processes
// 3. Results stored → Supabase with user_id
// 4. UI updates → Real-time subscriptions
// 5. Incidents created → Automatic for high-risk

// Use real-time hooks
import { useUserThreats, useUserIncidents } from '@/lib/useUserData';

function Dashboard() {
  const { threats, loading } = useUserThreats(userId);
  const { incidents } = useUserIncidents(userId);
  
  // Automatically updates when new threats detected!
  return <div>Threats: {threats.length}</div>;
}
```

---

## 🚀 Deployment

### AI Engine Deployment

**Docker:**
```bash
cd guardian_ai_engine
docker build -t guardian-ai-engine .
docker run -p 8000:8000 guardian-ai-engine
```

**Cloud (AWS/GCP/Azure):**
See `guardian_ai_engine/BACKEND_DEPLOYMENT.md`

### Frontend Deployment

**Vercel:**
```bash
npm run build
vercel deploy
```

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_AI_ENGINE_URL=https://your-ai-engine-url.com
```

---

## 📈 Performance

- **AI Engine Response:** < 200ms
- **Model Inference:** < 100ms
- **Database Query:** < 50ms
- **Real-time Updates:** < 500ms
- **Memory Usage:** < 100MB per worker

---

## 🔒 Security

- **End-to-End Encryption** - AES-256-GCM for vault
- **Row Level Security** - Database-level access control
- **Rate Limiting** - 100 requests/minute per endpoint
- **Input Validation** - Pydantic models
- **CORS Configuration** - Restricted origins
- **No SQL Injection** - Parameterized queries

---

## 📚 Project Structure

```
guardian-ai/
├── app/                          # Next.js pages
│   ├── dashboard/               # Dashboard pages
│   ├── login/                   # Login with threat detection
│   └── signup/                  # User registration
├── components/                   # React components
├── lib/                         # Core libraries
│   ├── aiEngineClient.ts       # AI Engine integration
│   ├── loginThreatMonitor.ts   # Real-time monitoring
│   ├── guardianAuth.ts         # Auth with threat detection
│   └── scamDetectionIntegrated.ts
├── guardian_ai_engine/          # Python AI Engine
│   ├── main.py                 # FastAPI server
│   ├── models/                 # Trained ML models
│   ├── training/               # Model training scripts
│   └── utils/                  # Feature extraction
├── diagnose_threat_detection.js # Diagnostic tool
├── test_threat_detection.js    # API testing
└── README.md                   # This file
```

---

## 🧪 Testing & Troubleshooting

### Test AI Engine Endpoints

**Login Detection:**
```bash
curl -X POST http://localhost:8000/predict/login \
  -H "Content-Type: application/json" \
  -d '{"failed_attempts": 5, "country_changed": true, "role_access_attempt": 0, "login_gap_minutes": 3}'
```

**URL Detection:**
```bash
curl -X POST http://localhost:8000/predict/url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypal-verify.tk/login"}'
```

**SMS Detection:**
```bash
curl -X POST http://localhost:8000/predict/sms \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT! Your bank account suspended. Click here now!"}'
```

### Common Issues

**AI Engine won't start:**
```bash
cd guardian_ai_engine
pip install -r requirements.txt
python train_all_models.py
python main.py
```

**No threat logs created:**
- Check `.env.local` has `NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000`
- Restart Next.js after changing env: `npm run dev`
- Check browser console for errors

**Models not found:**
```bash
cd guardian_ai_engine
python train_all_models.py
```

---

## 🎯 Key Benefits

✅ **Production-Ready AI** - FastAPI + scikit-learn models
✅ **Real-time Storage** - Automatic Supabase integration
✅ **User-Specific Data** - UUID-based data isolation
✅ **Fallback Support** - Works even if AI Engine is offline
✅ **Explainable AI** - Clear reasoning for all predictions
✅ **Auto-Scaling** - Handles high traffic
✅ **< 200ms Response** - Real-time inference
✅ **No Manual Storage** - Everything automatic

---

## 🗺️ Future Roadmap

- [ ] Deep learning models (BERT, transformers)
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Threat prediction models
- [ ] API rate limiting per user
- [ ] Webhook notifications
- [ ] Custom model training

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **FastAPI** - High-performance API framework
- **Scikit-learn** - Machine learning library
- **Supabase** - Backend platform
- **Next.js** - React framework
- **Vercel** - Hosting platform

---

## 📞 Contact

**Project:** https://github.com/pv5463/GuardianAI.git
**Email:** piyushofficial775@gmail.com

---

<div align="center">

**Built with ❤️ for India Innovators 2026**

*Securing the digital future with AI* 🛡️

</div>
