# AI Engine Integration Guide

## Overview

The Guardian AI frontend is now fully integrated with the Python AI Engine backend. All analysis results are automatically stored in Supabase with real-time updates based on user UUID.

## Architecture

```
User Action → Frontend Component → AI Engine Client → Python AI Engine
                                         ↓
                                   Supabase Storage
                                         ↓
                                   Real-time Updates
```

## Setup

### 1. Start AI Engine Backend

```bash
cd guardian_ai_engine
python train_all_models.py  # Train models (one time)
python main.py              # Start server
```

Backend runs at: http://localhost:8000

### 2. Configure Frontend

Edit `.env.local`:
```bash
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000
```

### 3. Start Frontend

```bash
npm run dev
```

## How It Works

### Automatic User Data Management

When a user signs up or logs in:
1. User UUID is automatically retrieved from Supabase Auth
2. All analysis requests include the user UUID
3. Results are stored in Supabase tables with user_id
4. Real-time subscriptions update UI automatically

### Data Flow

**Text/SMS Analysis:**
```typescript
import { analyzeText } from '@/lib/scamDetectionIntegrated';

// Automatically uses AI Engine and stores in Supabase
const result = await analyzeText(messageText, userId);

// Result includes:
// - risk_score from AI Engine
// - Stored in phishing_analysis table
// - Creates threat_log if high risk
// - Creates incident if critical
```

**URL Analysis:**
```typescript
import { analyzeURL } from '@/lib/scamDetectionIntegrated';

// Automatically uses AI Engine and stores in Supabase
const result = await analyzeURL(url, userId);

// Same automatic storage and incident creation
```

**Login Threat Detection:**
```typescript
import { detectLoginThreat } from '@/lib/aiEngineClient';

const result = await detectLoginThreat(userId, {
  failed_attempts: 5,
  country_changed: true,
  role_access_attempt: 2,
  login_gap_minutes: 3
});

// Automatically creates threat_log and incident
```

### Real-time Updates

**Using Hooks:**
```typescript
import { useUserThreats, useUserIncidents } from '@/lib/useUserData';

function MyComponent() {
  const { threats, loading } = useUserThreats(userId);
  const { incidents } = useUserIncidents(userId);

  // Automatically updates when new threats/incidents are created
  // No manual refresh needed!
}
```

## Integration Examples

### Example 1: Text Analysis Component

```typescript
'use client';

import { useState } from 'react';
import { analyzeText } from '@/lib/scamDetectionIntegrated';
import { getCurrentUser } from '@/lib/auth';

export default function TextAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Get current user
      const user = await getCurrentUser();
      
      // Analyze with AI Engine (auto-stores in Supabase)
      const analysis = await analyzeText(text, user?.id);
      setResult(analysis);
      
      // If AI Engine used, data is already in Supabase
      // If fallback used, you can manually store if needed
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      
      {result && (
        <div>
          <p>Risk Score: {result.score}</p>
          <p>Risk Level: {result.riskLevel}</p>
          <p>AI Engine Used: {result.aiEngineUsed ? 'Yes' : 'No (Fallback)'}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Real-time Threats Dashboard

```typescript
'use client';

import { useUserThreats } from '@/lib/useUserData';
import { getCurrentUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function ThreatsDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const { threats, loading, error } = useUserThreats(userId);

  useEffect(() => {
    getCurrentUser().then(user => setUserId(user?.id || null));
  }, []);

  if (loading) return <div>Loading threats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Threats ({threats.length})</h2>
      {threats.map(threat => (
        <div key={threat.id}>
          <h3>{threat.threat_type}</h3>
          <p>Risk: {threat.risk_score}/100</p>
          <p>Status: {threat.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: User Stats Widget

```typescript
'use client';

import { useUserStats } from '@/lib/useUserData';
import { getCurrentUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function UserStatsWidget() {
  const [userId, setUserId] = useState<string | null>(null);
  const stats = useUserStats(userId);

  useEffect(() => {
    getCurrentUser().then(user => setUserId(user?.id || null));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h3>Total Threats</h3>
        <p className="text-3xl">{stats.totalThreats}</p>
      </div>
      <div>
        <h3>Scams Detected</h3>
        <p className="text-3xl">{stats.scamsDetected}</p>
      </div>
      <div>
        <h3>Open Incidents</h3>
        <p className="text-3xl">{stats.openIncidents}</p>
      </div>
    </div>
  );
}
```

## Database Tables

### threat_logs
Stores all detected threats for each user:
- `user_id` (UUID) - Links to auth.users
- `threat_type` - Type of threat
- `severity` - low/medium/high/critical
- `risk_score` - 0-100
- `indicators` - Array of detected indicators
- `status` - active/investigating/resolved

### phishing_analysis
Stores all analysis results:
- `user_id` (UUID) - Links to auth.users
- `content` - Analyzed text/URL
- `content_type` - sms/url/email
- `risk_score` - 0-100
- `is_scam` - Boolean
- `detected_indicators` - Array of indicators

### incident_reports
Auto-created for high-risk threats:
- `affected_user_id` (UUID) - Links to auth.users
- `threat_log_id` - Links to threat_logs
- `severity` - low/medium/high/critical
- `status` - open/investigating/resolved/closed
- `mitigation_steps` - Array of recommended actions

## Real-time Subscriptions

All tables have real-time subscriptions enabled:

```typescript
// Automatically updates when:
// - New threat detected
// - Incident status changes
// - Analysis completed
// - Threat status updated
```

## Fallback Behavior

If AI Engine is unavailable:
1. System automatically uses local analysis
2. Results still stored in Supabase
3. `aiEngineUsed: false` flag in response
4. User experience unchanged

## Testing

### Test AI Engine Connection

```typescript
import { checkAIEngineHealth } from '@/lib/aiEngineClient';

const isHealthy = await checkAIEngineHealth();
console.log('AI Engine:', isHealthy ? 'Online' : 'Offline');
```

### Test Analysis

```bash
# Terminal 1: Start AI Engine
cd guardian_ai_engine
python main.py

# Terminal 2: Start Frontend
npm run dev

# Browser: Go to dashboard and analyze text/URL
# Check Supabase tables to see stored data
```

## Deployment

### Production Setup

1. **Deploy AI Engine:**
   - See `guardian_ai_engine/BACKEND_DEPLOYMENT.md`
   - Get production URL (e.g., https://api.yourdomain.com)

2. **Update Frontend:**
   ```bash
   # .env.local (production)
   NEXT_PUBLIC_AI_ENGINE_URL=https://api.yourdomain.com
   ```

3. **Deploy Frontend:**
   ```bash
   npm run build
   npm start
   ```

## Benefits

✅ **Automatic Storage** - All results saved to Supabase
✅ **Real-time Updates** - UI updates instantly
✅ **User-specific Data** - Each user sees only their data
✅ **Fallback Support** - Works even if AI Engine is down
✅ **Incident Creation** - Auto-creates incidents for high-risk threats
✅ **Historical Tracking** - Complete analysis history per user
✅ **Performance** - < 200ms AI Engine response time

## Troubleshooting

### AI Engine Not Connecting

```bash
# Check if AI Engine is running
curl http://localhost:8000/health

# Should return: {"status": "healthy", "models_loaded": {...}}
```

### Data Not Storing

1. Check Supabase connection in `.env.local`
2. Verify tables exist (run migration script)
3. Check RLS policies allow insert/update
4. Check browser console for errors

### Real-time Updates Not Working

1. Verify Supabase Realtime is enabled
2. Check subscription in browser DevTools
3. Ensure user is authenticated
4. Check RLS policies allow select

## Summary

The integration is complete and automatic:
- User signs up → Gets UUID
- User analyzes content → AI Engine processes
- Results stored → Supabase with user_id
- UI updates → Real-time subscriptions
- Incidents created → Automatic for high-risk

No manual data management needed!
