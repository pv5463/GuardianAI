# Incident Resolution Debugging Guide

## Common Errors & Solutions

### Error 1: "Failed to resolve incident"

**Possible Causes:**
1. Database table doesn't exist
2. RLS (Row Level Security) policy blocking update
3. User doesn't have permission
4. Network/connection issue

**Solution Steps:**

#### Step 1: Check Database Tables

Open Supabase Dashboard → SQL Editor and run:

```sql
-- Check if incident_reports table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'incident_reports'
);

-- Should return: true
```

If returns `false`, run the migration script:
```sql
-- Copy and paste content from supabase-guardianai-migration.sql
```

#### Step 2: Check RLS Policies

```sql
-- View current policies on incident_reports
SELECT * FROM pg_policies 
WHERE tablename = 'incident_reports';

-- If no policies exist, add them:
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Users can view incidents"
ON incident_reports FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update
CREATE POLICY "Users can update incidents"
ON incident_reports FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

#### Step 3: Check User Authentication

Open browser console (F12) and run:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Should show user object with id, email, etc.
// If null, user is not logged in
```

#### Step 4: Test Update Directly

In Supabase Dashboard → SQL Editor:

```sql
-- Find an incident
SELECT id, status FROM incident_reports LIMIT 1;

-- Try to update it (replace YOUR_INCIDENT_ID)
UPDATE incident_reports 
SET status = 'resolved',
    updated_at = NOW(),
    resolved_at = NOW(),
    resolution_notes = 'Test resolution'
WHERE id = 'YOUR_INCIDENT_ID';

-- Check if it worked
SELECT id, status, resolution_notes FROM incident_reports 
WHERE id = 'YOUR_INCIDENT_ID';
```

If this works, the issue is in the frontend code.
If this fails, the issue is with database permissions.

---

### Error 2: "Permission denied for table incident_reports"

**Solution:**

```sql
-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON incident_reports TO authenticated;
GRANT USAGE ON SEQUENCE incident_reports_id_seq TO authenticated;

-- Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'incident_reports';
```

---

### Error 3: Button click does nothing

**Check Browser Console:**

1. Open DevTools (F12)
2. Go to Console tab
3. Click "Mark as Resolved"
4. Look for error messages

**Common console errors:**

**"Cannot read property 'id' of undefined"**
- Solution: Incident object is malformed
- Check: `console.log(incident)` before calling update

**"Network request failed"**
- Solution: Check Supabase connection
- Verify `.env.local` has correct credentials

**"updateIncidentStatus is not a function"**
- Solution: Import issue
- Check: `import { updateIncidentStatus } from '@/lib/incidentResponse'`

---

## Debugging Checklist

### Frontend Debugging

Add console logs to `app/dashboard/incidents/page.tsx`:

```typescript
const handleResolve = async (incidentId: string) => {
  console.log('=== RESOLVE INCIDENT DEBUG ===');
  console.log('1. Incident ID:', incidentId);
  
  setResolving(incidentId);
  setError('');
  
  try {
    console.log('2. Calling updateIncidentStatus...');
    const result = await updateIncidentStatus(
      incidentId, 
      'resolved', 
      'Incident resolved by user action'
    );
    console.log('3. Update result:', result);
    
    console.log('4. Reloading data...');
    await loadData();
    console.log('5. Data reloaded successfully');
    
    setError('');
  } catch (error: any) {
    console.error('6. ERROR:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    setError(`Failed to resolve incident: ${error.message || 'Unknown error'}`);
  } finally {
    console.log('7. Cleaning up...');
    setResolving(null);
  }
};
```

### Backend Debugging

Add console logs to `lib/incidentResponse.ts`:

```typescript
export async function updateIncidentStatus(
  incidentId: string,
  status: 'open' | 'investigating' | 'resolved' | 'closed',
  resolutionNotes?: string
) {
  try {
    console.log('=== UPDATE INCIDENT STATUS ===');
    console.log('Incident ID:', incidentId);
    console.log('New Status:', status);
    console.log('Resolution Notes:', resolutionNotes);
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      if (resolutionNotes) {
        updateData.resolution_notes = resolutionNotes;
      }
    }

    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('incident_reports')
      .update(updateData)
      .eq('id', incidentId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Update successful:', data);
    return data;
  } catch (error) {
    console.error('updateIncidentStatus error:', error);
    throw error;
  }
}
```

---

## Quick Fix Script

Run this in Supabase SQL Editor to fix common issues:

```sql
-- Fix 1: Ensure table exists and has correct structure
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_log_id UUID REFERENCES threat_logs(id),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  affected_user_id UUID REFERENCES auth.users(id),
  mitigation_steps TEXT[],
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Fix 2: Enable RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Fix 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view incidents" ON incident_reports;
DROP POLICY IF EXISTS "Users can update incidents" ON incident_reports;
DROP POLICY IF EXISTS "Users can insert incidents" ON incident_reports;

-- Fix 4: Create new policies
CREATE POLICY "Users can view incidents"
ON incident_reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update incidents"
ON incident_reports FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can insert incidents"
ON incident_reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix 5: Grant permissions
GRANT ALL ON incident_reports TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Fix 6: Verify setup
SELECT 
  'Table exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'incident_reports'
  ) as result
UNION ALL
SELECT 
  'RLS enabled',
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'incident_reports')
UNION ALL
SELECT 
  'Policies count',
  (SELECT COUNT(*)::boolean FROM pg_policies WHERE tablename = 'incident_reports');
```

---

## Test Resolution Manually

### Step 1: Create Test Incident

```sql
-- Insert test incident
INSERT INTO incident_reports (
  title,
  description,
  severity,
  status,
  mitigation_steps
) VALUES (
  'Test Incident',
  'This is a test incident for debugging',
  'medium',
  'open',
  ARRAY['Step 1: Test', 'Step 2: Verify']
) RETURNING id;

-- Note the returned ID
```

### Step 2: Try to Resolve It

In browser console:

```javascript
// Import the function
const { updateIncidentStatus } = await import('/lib/incidentResponse');

// Try to resolve (replace with your test incident ID)
const result = await updateIncidentStatus(
  'YOUR_TEST_INCIDENT_ID',
  'resolved',
  'Test resolution'
);

console.log('Result:', result);
```

### Step 3: Verify in Database

```sql
-- Check if it was updated
SELECT id, status, resolution_notes, resolved_at 
FROM incident_reports 
WHERE id = 'YOUR_TEST_INCIDENT_ID';

-- Should show:
-- status: 'resolved'
-- resolution_notes: 'Test resolution'
-- resolved_at: (timestamp)
```

---

## Environment Check

### Verify Supabase Connection

Create `test-supabase-connection.ts` in your project:

```typescript
import { supabase } from '@/lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Auth test:', user ? '✓ Authenticated' : '✗ Not authenticated');
  if (authError) console.error('Auth error:', authError);
  
  // Test 2: Check database
  const { data, error } = await supabase
    .from('incident_reports')
    .select('count')
    .limit(1);
  console.log('Database test:', error ? '✗ Failed' : '✓ Connected');
  if (error) console.error('Database error:', error);
  
  // Test 3: Check update permission
  const { error: updateError } = await supabase
    .from('incident_reports')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake ID
  console.log('Update permission:', updateError?.code === 'PGRST116' ? '✓ Allowed' : '✗ Denied');
  if (updateError && updateError.code !== 'PGRST116') {
    console.error('Update error:', updateError);
  }
}

testConnection();
```

---

## Still Not Working?

### Last Resort: Reset Everything

```sql
-- WARNING: This will delete all incidents!
-- Backup first if you have important data

-- Drop and recreate table
DROP TABLE IF EXISTS incident_reports CASCADE;

-- Then run the full migration script again
-- Copy content from supabase-guardianai-migration.sql
```

---

## Get Help

If still having issues, provide:

1. **Browser console output** (F12 → Console)
2. **Network tab** (F12 → Network → Look for failed requests)
3. **Supabase logs** (Dashboard → Logs)
4. **Error message** (exact text)
5. **Steps to reproduce**

Post in GitHub issues or contact support with this information.
