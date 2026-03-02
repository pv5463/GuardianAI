# Complete Setup Guide - Guardian AI

## Part 1: Python AI Engine Setup

### Step 1: Navigate to Engine Directory

```bash
cd guardian_ai_engine
```

### Step 2: Install Dependencies (Choose One Method)

**Method A: Automated (Windows)**
```bash
# Double-click this file:
install_windows.bat
```

**Method B: Manual**
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 3: Train Models

**Option A: Train All at Once (Recommended)**
```bash
python train_all_models.py
```

**Option B: Train Individually**
```bash
python -m training.train_login_model
python -m training.train_url_model
python -m training.train_sms_model
```

### Step 4: Start Backend Server

```bash
python main.py
```

Server runs at: http://localhost:8000

### Step 5: Test API

**Open new terminal:**
```bash
cd guardian_ai_engine
venv\Scripts\activate  # Windows
python test_api.py
```

---

## Part 2: Next.js Frontend Setup

### Step 1: Install Dependencies

```bash
# In project root (not guardian_ai_engine)
npm install
```

### Step 2: Configure Environment

**Edit `.env.local`:**
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# AI Engine (Required)
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000

# OpenAI (Optional - only for uploaded audio transcription)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Setup Database

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy content from `supabase-guardianai-migration.sql`
4. Paste and execute
5. Verify tables created

### Step 4: Start Frontend

```bash
npm run dev
```

Frontend runs at: http://localhost:3000

---

## Part 3: Fix Incident Resolution

### If "Mark as Resolved" Doesn't Work

**Step 1: Check Database**

Run in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'incident_reports'
);

-- If false, run migration script
```

**Step 2: Fix RLS Policies**

```sql
-- Enable RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view incidents"
ON incident_reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update incidents"
ON incident_reports FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON incident_reports TO authenticated;
```

**Step 3: Test in Browser Console**

```javascript
// Open DevTools (F12) → Console
const { supabase } = await import('/lib/supabase');

// Check auth
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Try update
const { data, error } = await supabase
  .from('incident_reports')
  .update({ status: 'resolved' })
  .eq('id', 'YOUR_INCIDENT_ID')
  .select();

console.log('Result:', data, error);
```

**Step 4: Check Console Logs**

When you click "Mark as Resolved":
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

**See `INCIDENT_RESOLUTION_DEBUG.md` for detailed troubleshooting**

---

## Part 4: Deploy Backend Engine

### Option 1: Local (Development)

```bash
cd guardian_ai_engine
python main.py
```

### Option 2: Docker

```bash
cd guardian_ai_engine
docker-compose up -d
```

### Option 3: Cloud (Production)

**AWS EC2:**
```bash
# SSH into instance
ssh -i key.pem ubuntu@your-ip

# Setup
git clone your-repo
cd guardian-ai/guardian_ai_engine
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_all_models.py

# Run with systemd (see BACKEND_DEPLOYMENT.md)
```

**Heroku:**
```bash
# Add Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create guardian-ai-engine
git push heroku main
```

**Railway/Render:**
1. Connect GitHub repo
2. Set root directory: `guardian_ai_engine`
3. Build command: `python train_all_models.py`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**See `BACKEND_DEPLOYMENT.md` for detailed deployment guide**

---

## Part 5: Integration

### Update Frontend to Use Backend

**Edit `.env.local`:**
```bash
# Local
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000

# Production
NEXT_PUBLIC_AI_ENGINE_URL=https://your-backend-url.com
```

**Create API Client (`lib/aiEngineClient.ts`):**

```typescript
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL;

export async function detectLoginThreat(data: any) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function detectPhishingURL(url: string) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return response.json();
}

export async function detectSMSScam(text: string) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
}
```

**Use in Components:**

```typescript
import { detectSMSScam } from '@/lib/aiEngineClient';

const handleAnalyze = async () => {
  const result = await detectSMSScam(messageText);
  console.log('Risk:', result.risk_score);
  console.log('Classification:', result.classification);
};
```

---

## Troubleshooting

### Python Engine Issues

**"No module named 'utils'"**
```bash
# Make sure you're in guardian_ai_engine directory
cd guardian_ai_engine
python train_all_models.py
```

**"Models not loading"**
```bash
# Retrain models
python train_all_models.py

# Verify models exist
ls models/
# Should see: login_model.pkl, url_model.pkl, sms_model.pkl
```

**"Port 8000 already in use"**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux
lsof -i :8000
kill -9 <PID>
```

### Frontend Issues

**"Failed to resolve incident"**
- See `INCIDENT_RESOLUTION_DEBUG.md`
- Check Supabase RLS policies
- Verify user is authenticated
- Check browser console for errors

**"Threat stats incorrect"**
- Already fixed in code
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

**"Audio transcription not working"**
- Use Chrome or Edge browser
- Allow microphone permissions
- Click "Record Audio" (not "Upload")
- See `AUDIO_IMAGE_FEATURES.md`

**"Image OCR not working"**
- Use clear, high-resolution images
- Supported formats: JPG, PNG, WebP
- Check file size < 10MB
- See `AUDIO_IMAGE_FEATURES.md`

---

## Verification Checklist

### Backend Engine
- [ ] Models trained successfully
- [ ] Server starts without errors
- [ ] Health endpoint returns healthy
- [ ] Test API script passes
- [ ] All 3 models loaded

### Frontend
- [ ] npm install completes
- [ ] .env.local configured
- [ ] Database migration run
- [ ] npm run dev starts
- [ ] Can login/signup

### Features
- [ ] Audio recording works (Chrome/Edge)
- [ ] Image OCR extracts text
- [ ] Incident resolution updates status
- [ ] Threat filtering shows correct stats
- [ ] Scam detection analyzes text

### Integration
- [ ] Frontend connects to backend
- [ ] API calls return results
- [ ] Error handling works
- [ ] CORS configured correctly

---

## Quick Commands Reference

### Backend
```bash
cd guardian_ai_engine
python train_all_models.py  # Train models
python main.py              # Start server
python test_api.py          # Test API
```

### Frontend
```bash
npm install                 # Install deps
npm run dev                 # Start dev server
npm run build               # Build for production
npm start                   # Start production
```

### Docker
```bash
docker-compose up -d        # Start services
docker-compose logs -f      # View logs
docker-compose down         # Stop services
```

---

## Documentation Files

- `README.md` - Main project documentation
- `AUDIO_IMAGE_FEATURES.md` - Audio/image features guide
- `FIXES_APPLIED.md` - Summary of fixes
- `QUICK_START_FEATURES.md` - Quick reference
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `VERIFICATION_CHECKLIST.md` - Testing checklist
- `BACKEND_DEPLOYMENT.md` - Backend deployment guide
- `INCIDENT_RESOLUTION_DEBUG.md` - Incident debugging
- `COMPLETE_SETUP_GUIDE.md` - This file

---

## Support

For help:
1. Check relevant documentation file
2. Review browser console (F12)
3. Check server logs
4. Verify database setup
5. Test with curl/Postman

---

## Summary

**To get everything working:**

1. **Train models:** `cd guardian_ai_engine && python train_all_models.py`
2. **Start backend:** `python main.py`
3. **Setup database:** Run migration script in Supabase
4. **Configure frontend:** Edit `.env.local`
5. **Start frontend:** `npm run dev`
6. **Test features:** Follow verification checklist

**All core features work WITHOUT API keys!**
- Audio transcription (live recording)
- Image OCR (Tesseract.js)
- Scam detection
- Incident management
- Threat monitoring

**Optional:** Add Whisper API key for uploaded audio file transcription.

---

**Setup Complete! 🎉**
