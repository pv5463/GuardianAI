-- GuardianAI Safe Migration Script
-- This script safely adds new tables without conflicts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert roles only if they don't exist
INSERT INTO roles (name, permissions) 
SELECT 'admin', '{"all": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

INSERT INTO roles (name, permissions) 
SELECT 'analyst', '{"view_threats": true, "analyze": true, "view_reports": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'analyst');

INSERT INTO roles (name, permissions) 
SELECT 'staff', '{"view_threats": true, "submit_reports": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'staff');

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role_id UUID REFERENCES roles(id),
  department TEXT,
  phone TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP WITH TIME ZONE,
  otp_verified BOOLEAN DEFAULT FALSE,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LOGIN LOGS TABLE
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  location TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  risk_score INTEGER DEFAULT 0,
  risk_factors JSONB DEFAULT '[]',
  device_fingerprint TEXT,
  session_id TEXT
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success);

-- 4. THREAT LOGS TABLE
CREATE TABLE IF NOT EXISTS threat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip TEXT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  indicators JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive'))
);

CREATE INDEX IF NOT EXISTS idx_threat_logs_severity ON threat_logs(severity);
CREATE INDEX IF NOT EXISTS idx_threat_logs_detected_at ON threat_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_logs_status ON threat_logs(status);

-- 5. INCIDENT REPORTS TABLE
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_log_id UUID REFERENCES threat_logs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  mitigation_steps JSONB DEFAULT '[]',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON incident_reports(created_at DESC);

-- 6. ENCRYPTED NOTES TABLE
CREATE TABLE IF NOT EXISTS encrypted_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  encryption_method TEXT DEFAULT 'AES-256',
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_encrypted_notes_user_id ON encrypted_notes(user_id);

-- 7. ACTIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON active_sessions(is_active);

-- 8. PHISHING ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS phishing_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('email', 'sms', 'url', 'audio')),
  content TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  indicators JSONB DEFAULT '[]',
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phishing_analysis_user_id ON phishing_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_phishing_analysis_created_at ON phishing_analysis(created_at DESC);

-- 9. SYSTEM METRICS TABLE
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL UNIQUE,
  total_threats INTEGER DEFAULT 0,
  critical_threats INTEGER DEFAULT 0,
  high_threats INTEGER DEFAULT 0,
  medium_threats INTEGER DEFAULT 0,
  low_threats INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  failed_logins INTEGER DEFAULT 0,
  incidents_created INTEGER DEFAULT 0,
  incidents_resolved INTEGER DEFAULT 0,
  phishing_attempts_blocked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date DESC);

-- FUNCTIONS

-- Update updated_at column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_incident_reports_updated_at ON incident_reports;
DROP TRIGGER IF EXISTS update_encrypted_notes_updated_at ON encrypted_notes;

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encrypted_notes_updated_at
  BEFORE UPDATE ON encrypted_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create incident report function
CREATE OR REPLACE FUNCTION auto_create_incident_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity IN ('high', 'critical') THEN
    INSERT INTO incident_reports (
      threat_log_id,
      title,
      description,
      severity,
      affected_user_id,
      mitigation_steps
    ) VALUES (
      NEW.id,
      'Auto-generated: ' || NEW.threat_type,
      NEW.description,
      NEW.severity,
      NEW.target_user_id,
      CASE 
        WHEN NEW.threat_type = 'brute_force' THEN '["Lock affected account", "Reset password", "Enable 2FA", "Review access logs"]'::jsonb
        WHEN NEW.threat_type = 'suspicious_login' THEN '["Verify user identity", "Check device fingerprint", "Review login location", "Enable additional verification"]'::jsonb
        WHEN NEW.threat_type = 'privilege_escalation' THEN '["Revoke elevated privileges", "Audit permission changes", "Review user activity", "Notify security team"]'::jsonb
        ELSE '["Investigate threat", "Contain affected systems", "Notify relevant parties", "Document findings"]'::jsonb
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_create_incident ON threat_logs;

CREATE TRIGGER trigger_auto_create_incident
  AFTER INSERT ON threat_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_incident_report();

-- ROW LEVEL SECURITY

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phishing_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own login logs" ON login_logs;
DROP POLICY IF EXISTS "Admins can view all login logs" ON login_logs;
DROP POLICY IF EXISTS "Authenticated users can view threat logs" ON threat_logs;
DROP POLICY IF EXISTS "Admins and analysts can insert threat logs" ON threat_logs;
DROP POLICY IF EXISTS "Authenticated users can view incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Admins and analysts can manage incidents" ON incident_reports;
DROP POLICY IF EXISTS "Users can view own encrypted notes" ON encrypted_notes;
DROP POLICY IF EXISTS "Users can create own encrypted notes" ON encrypted_notes;
DROP POLICY IF EXISTS "Users can update own encrypted notes" ON encrypted_notes;
DROP POLICY IF EXISTS "Users can delete own encrypted notes" ON encrypted_notes;
DROP POLICY IF EXISTS "Users can view own sessions" ON active_sessions;
DROP POLICY IF EXISTS "Users can view own phishing analysis" ON phishing_analysis;
DROP POLICY IF EXISTS "Users can create phishing analysis" ON phishing_analysis;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own login logs" ON login_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login logs" ON login_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view threat logs" ON threat_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can insert threat logs" ON threat_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.name IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Authenticated users can view incident reports" ON incident_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can manage incidents" ON incident_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.name IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Users can view own encrypted notes" ON encrypted_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own encrypted notes" ON encrypted_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own encrypted notes" ON encrypted_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own encrypted notes" ON encrypted_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON active_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own phishing analysis" ON phishing_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create phishing analysis" ON phishing_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'GuardianAI migration completed successfully!';
END $$;
