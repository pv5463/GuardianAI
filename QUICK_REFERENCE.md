# Quick Reference - Guardian AI

## 🚀 Quick Start

### Start AI Engine
```bash
cd guardian_ai_engine
python train_all_models.py  # First time only
python main.py              # http://localhost:8000
```

### Start Frontend
```bash
npm run dev                 # http://localhost:3000
```

---

## 📁 Essential Files

### AI Engine Integration
- `lib/aiEngineClient.ts` - AI Engine API client
- `lib/scamDetectionIntegrated.ts` - Integrated detection
- `lib/useUserData.ts` - Real-time hooks

### Documentation
- `README.md` - Main documentation
- `AI_ENGINE_INTEGRATION.md` - Integration guide
- `guardian_ai_engine/BACKEND_DEPLOYMENT.md` - Deployment

### Database
- `supabase-guardianai-migration.sql` - Complete schema

---

## 💻 Code Examples

### Analyze Text
```typescript
import { analyzeText } from '@/lib/scamDetectionIntegrated';

const result = await analyzeText(text, userId);
// Auto-stores in Supabase!
```

### Real-time Threats
```typescript
import { useUserThreats } from '@/lib/useUserData';

const { threats, loading } = useUserThreats(userId);
// Auto-updates!
```

### Check AI Engine
```typescript
import { checkAIEngineHealth } from '@/lib/aiEngineClient';

const isOnline = await checkAIEngineHealth();
```

---

## 🔧 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxx  # Optional
```

---

## 🧪 Testing

### Test AI Engine
```bash
cd guardian_ai_engine
python test_api.py
```

### Test API Endpoints
```bash
# Health
curl http://localhost:8000/health

# Login Detection
curl -X POST http://localhost:8000/predict/login \
  -H "Content-Type: application/json" \
  -d '{"failed_attempts": 5, "country_changed": true, "role_access_attempt": 2, "login_gap_minutes": 3}'

# URL Detection
curl -X POST http://localhost:8000/predict/url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypal-verify.tk/login"}'

# SMS Detection
curl -X POST http://localhost:8000/predict/sms \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT! Your bank account suspended!"}'
```

---

## 📊 Database Tables

### threat_logs
- Stores all detected threats
- Linked to user_id (UUID)
- Real-time subscriptions enabled

### phishing_analysis
- Stores all analysis results
- Linked to user_id (UUID)
- Tracks SMS, URL, email analysis

### incident_reports
- Auto-created for high-risk threats
- Linked to affected_user_id (UUID)
- Status tracking (open/investigating/resolved)

---

## 🔄 Data Flow

```
User Action
    ↓
Frontend Component
    ↓
AI Engine Client (lib/aiEngineClient.ts)
    ↓
Python AI Engine (FastAPI)
    ↓
Supabase Storage (with user_id)
    ↓
Real-time UI Updates (WebSocket)
```

---

## 🐛 Troubleshooting

### AI Engine Not Starting
```bash
cd guardian_ai_engine
pip install -r requirements.txt
python train_all_models.py
python main.py
```

### Models Not Found
```bash
cd guardian_ai_engine
python train_all_models.py
ls models/  # Should see .pkl files
```

### Frontend Not Connecting
```bash
# Check .env.local
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000

# Restart frontend
npm run dev
```

### Database Errors
```sql
-- Run in Supabase SQL Editor
-- Copy from supabase-guardianai-migration.sql
```

---

## 📦 Deployment

### AI Engine (Docker)
```bash
cd guardian_ai_engine
docker build -t guardian-ai-engine .
docker run -p 8000:8000 guardian-ai-engine
```

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

---

## 📚 Documentation

- **README.md** - Main documentation
- **AI_ENGINE_INTEGRATION.md** - Integration guide
- **CLEANUP_SUMMARY.md** - What changed
- **guardian_ai_engine/README.md** - AI Engine docs
- **guardian_ai_engine/BACKEND_DEPLOYMENT.md** - Deployment

---

## ✅ Checklist

- [ ] AI Engine running (port 8000)
- [ ] Frontend running (port 3000)
- [ ] Database migrated (Supabase)
- [ ] Environment variables set
- [ ] Models trained
- [ ] Test API working
- [ ] Real-time updates working

---

**Everything you need in one place!** 🎉
