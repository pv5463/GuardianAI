# 🚀 GuardianAI Setup Guide

Complete setup instructions for India Innovators 2026 hackathon judges and evaluators.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/guardianai.git
cd guardianai
npm install
```

### Step 2: Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API Key (Optional - for audio transcription)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-here

# Optional API Keys
NEXT_PUBLIC_VIRUSTOTAL_API_KEY=your-virustotal-key
NEXT_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY=your-google-key
```

### Step 3: Database Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database to initialize

2. **Run Migration Script**
   - Open Supabase Dashboard → SQL Editor
   - Copy entire content of `supabase-guardianai-migration.sql`
   - Paste and click "Run"
   - Wait for success message

3. **Add Test Data**
   - In SQL Editor, create new query
   - Copy content of `supabase-simple-test.sql`
   - Paste and click "Run"
   - Verify: "Threats inserted: 3", "Incidents inserted: 3"

### Step 4: Start Application

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 📋 Detailed Setup

### Prerequisites

#### Required
- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Supabase Account** (free tier works)
- **Modern Browser** (Chrome, Firefox, Edge, Safari)

#### Optional
- **OpenAI API Key** - For Whisper audio transcription
- **VirusTotal API Key** - For URL scanning
- **Google Safe Browsing API Key** - For phishing detection

### Installation Steps

#### 1. Clone Repository

```bash
# HTTPS
git clone https://github.com/yourusername/guardianai.git

# SSH
git clone git@github.com:yourusername/guardianai.git

cd guardianai
```

#### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS
- Framer Motion
- Supabase Client
- Recharts
- Tesseract.js
- And more...

#### 3. Supabase Setup

##### Create Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name:** GuardianAI
   - **Database Password:** (save this!)
   - **Region:** Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

##### Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

##### Run Database Migration

1. Click **SQL Editor** in sidebar
2. Click **New Query**
3. Open `supabase-guardianai-migration.sql` in your code editor
4. Copy ALL content (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **Run** (or Ctrl+Enter)
7. Wait for "Success" message

##### Verify Tables Created

Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- active_sessions
- encrypted_notes
- incident_reports
- login_logs
- phishing_analysis
- roles
- system_metrics
- threat_logs
- user_profiles

##### Add Test Data

1. Create new query in SQL Editor
2. Copy content of `supabase-simple-test.sql`
3. Paste and Run
4. Verify output shows data inserted

#### 4. Environment Configuration

Create `.env.local` file in root:

```env
# ============================================
# REQUIRED - Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# OPTIONAL - OpenAI Whisper (Audio Transcription)
# ============================================
# Get from: https://platform.openai.com/api-keys
# Without this, audio upload won't transcribe (live recording still works)
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-...

# ============================================
# OPTIONAL - URL Scanning APIs
# ============================================
# VirusTotal API (for URL reputation)
# Get from: https://www.virustotal.com/gui/my-apikey
NEXT_PUBLIC_VIRUSTOTAL_API_KEY=your-key-here

# Google Safe Browsing API
# Get from: https://console.cloud.google.com
NEXT_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY=your-key-here
```

**Important Notes:**
- Never commit `.env.local` to git (already in `.gitignore`)
- Replace all placeholder values with your actual keys
- Supabase keys are REQUIRED, others are optional

#### 5. Start Development Server

```bash
npm run dev
```

Output should show:
```
  ▲ Next.js 16.x.x
  - Local:        http://localhost:3000
  - Ready in X.Xs
```

#### 6. Create Your Account

1. Visit http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Fill in:
   - Email
   - Password (min 6 characters)
   - Full Name
4. Click "Sign Up"
5. You're automatically logged in!

#### 7. Explore Features

Navigate to:
- **Dashboard** - `/dashboard` - Scam detection tools
- **Threats** - `/dashboard/threats` - Real-time threat monitor
- **Incidents** - `/dashboard/incidents` - Incident management
- **Vault** - `/dashboard/vault` - Encrypted storage
- **Analytics** - `/dashboard/analytics` - Security metrics
- **Profile** - `/dashboard/profile` - User settings

---

## 🧪 Testing the Application

### Test Scam Detection

1. Go to Dashboard
2. Paste this scam message:
```
URGENT: Your bank account will be blocked in 2 hours.
Click here to verify: http://sbi-verify.xyz
Share OTP immediately to avoid legal action.
```
3. Click "Analyze Text"
4. Should show HIGH/CRITICAL risk with detected indicators

### Test Voice Analysis

1. Go to Dashboard → Voice Analyzer
2. Click "Record Audio"
3. Allow microphone access
4. Speak clearly: "Hello, this is a test"
5. Click "Stop Recording"
6. Click "Analyze Audio"
7. View transcription, pitch data, AI detection

### Test Screenshot Analysis

1. Go to Dashboard → Screenshot Analyzer
2. Upload a screenshot with text
3. Wait for OCR processing
4. View extracted text and scam analysis

### Test Encrypted Vault

1. Go to Vault
2. Click "New Note"
3. Enter:
   - Title: "Test Secret"
   - Content: "This is encrypted"
   - Password: "MyPassword123"
4. Click "Create Encrypted Note"
5. Click "View Note"
6. Enter password to decrypt

### Test Threat Monitor

1. Go to Threats page
2. Should see 3 test threats
3. Filter by severity
4. Check real-time updates

### Test Incident Response

1. Go to Incidents page
2. Should see 3 test incidents
3. Click to expand incident
4. View mitigation steps
5. Click "Mark as Resolved"

---

## 🔧 Troubleshooting

### Issue: "Database tables not found"

**Solution:**
1. Run `supabase-guardianai-migration.sql` in Supabase SQL Editor
2. Verify tables exist with query above
3. Refresh your app

### Issue: "Permission denied"

**Solution:**
1. Check if you're logged in
2. Verify RLS policies exist:
```sql
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```
3. If count is 0, run migration script again

### Issue: Empty pages (no data)

**Solution:**
1. Run `supabase-simple-test.sql` to add test data
2. Verify data exists:
```sql
SELECT COUNT(*) FROM threat_logs;
SELECT COUNT(*) FROM incident_reports;
```

### Issue: Audio transcription not working

**Solution:**
- **For live recording:** Use Chrome or Edge browser
- **For file upload:** Add OpenAI API key to `.env.local`

### Issue: "Failed to fetch"

**Solution:**
1. Check `.env.local` has correct Supabase URL and key
2. Verify Supabase project is running
3. Check browser console for specific error

### Issue: Build errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Add environment variables from `.env.local`
   - Click "Deploy"

3. **Configure Domain**
   - Add custom domain in Vercel settings
   - Update DNS records

### Environment Variables for Production

Add these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_OPENAI_API_KEY` (optional)

---

## 📊 Verification Checklist

Before demo/presentation, verify:

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Database migration completed
- [ ] Test data inserted
- [ ] Application runs (`npm run dev`)
- [ ] Can sign up and log in
- [ ] Dashboard loads correctly
- [ ] Threats page shows data
- [ ] Incidents page shows data
- [ ] Vault page loads
- [ ] Analytics page loads
- [ ] Scam detection works
- [ ] Voice analysis works
- [ ] Screenshot analysis works
- [ ] No console errors

---

## 🎯 Demo Script

For hackathon presentation:

1. **Landing Page** (30 sec)
   - Show hero section
   - Highlight key features
   - Click "Get Started"

2. **Dashboard** (2 min)
   - Analyze scam message
   - Show risk score
   - Demonstrate URL analysis
   - Upload screenshot

3. **Threat Monitor** (1 min)
   - Show real-time threats
   - Filter by severity
   - Explain threat types

4. **Incident Response** (1 min)
   - Show auto-generated incidents
   - Expand incident details
   - Demonstrate resolution

5. **Encrypted Vault** (1 min)
   - Create encrypted note
   - Show encryption process
   - Decrypt with password

6. **Analytics** (1 min)
   - Show metrics dashboard
   - Explain safety score
   - Display trend charts

---

## 📞 Support

For setup issues during hackathon:

**Email:** team@guardianai.com  
**GitHub Issues:** https://github.com/yourusername/guardianai/issues

---

## ✅ Success Indicators

When everything is working:
- ✅ No console errors
- ✅ All pages load quickly
- ✅ Data displays correctly
- ✅ Real-time updates work
- ✅ Animations are smooth
- ✅ Mobile responsive

---

**Ready to secure the digital future! 🛡️**
