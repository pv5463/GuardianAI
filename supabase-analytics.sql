-- Update existing tables with new fields

-- Add new columns to voice_scans if not exists
ALTER TABLE voice_scans ADD COLUMN IF NOT EXISTS scam_type TEXT;
ALTER TABLE voice_scans ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0;
ALTER TABLE voice_scans ADD COLUMN IF NOT EXISTS impersonation_score INTEGER DEFAULT 0;
ALTER TABLE voice_scans ADD COLUMN IF NOT EXISTS financial_score INTEGER DEFAULT 0;
ALTER TABLE voice_scans ADD COLUMN IF NOT EXISTS technical_score INTEGER DEFAULT 0;

-- Create scans table for text/url/upi analysis
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL,
  content TEXT NOT NULL,
  scam_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  scam_score INTEGER NOT NULL,
  urgency_score INTEGER DEFAULT 0,
  impersonation_score INTEGER DEFAULT 0,
  financial_score INTEGER DEFAULT 0,
  technical_score INTEGER DEFAULT 0,
  detected_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create impact_stats table
CREATE TABLE IF NOT EXISTS impact_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  high_risk_count INTEGER DEFAULT 0,
  estimated_loss_prevented BIGINT DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table for safety scores
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_scans INTEGER DEFAULT 0,
  reports_submitted INTEGER DEFAULT 0,
  high_risk_avoided INTEGER DEFAULT 0,
  safety_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Scans Policies
CREATE POLICY "Users can read their own scans"
  ON scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Impact Stats Policies (read-only for all authenticated users)
CREATE POLICY "Anyone can read impact stats"
  ON impact_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert impact stats"
  ON impact_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update impact stats"
  ON impact_stats FOR UPDATE
  TO authenticated
  USING (true);

-- User Stats Policies
CREATE POLICY "Users can read their own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE scans;
ALTER PUBLICATION supabase_realtime ADD TABLE impact_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stats;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_risk_level ON scans(risk_level);
CREATE INDEX IF NOT EXISTS idx_scans_scam_type ON scans(scam_type);
CREATE INDEX IF NOT EXISTS idx_impact_stats_date ON impact_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_scans, high_risk_avoided, safety_score)
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END,
    10
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_scans = user_stats.total_scans + 1,
    high_risk_avoided = user_stats.high_risk_avoided + 
      CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END,
    safety_score = LEAST(100, 
      (user_stats.total_scans + 1) * 5 + 
      (user_stats.high_risk_avoided + CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) * 10 +
      user_stats.reports_submitted * 3
    ),
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scans
CREATE TRIGGER update_user_stats_on_scan
AFTER INSERT ON scans
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- Function to update impact stats
CREATE OR REPLACE FUNCTION update_impact_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO impact_stats (date, high_risk_count, estimated_loss_prevented, total_scans)
  VALUES (
    CURRENT_DATE,
    CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END,
    CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 8000 ELSE 0 END,
    1
  )
  ON CONFLICT (date) DO UPDATE SET
    high_risk_count = impact_stats.high_risk_count + 
      CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END,
    estimated_loss_prevented = impact_stats.estimated_loss_prevented + 
      CASE WHEN NEW.risk_level IN ('high', 'critical') THEN 8000 ELSE 0 END,
    total_scans = impact_stats.total_scans + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for impact stats
CREATE TRIGGER update_impact_stats_on_scan
AFTER INSERT ON scans
FOR EACH ROW
EXECUTE FUNCTION update_impact_stats();

-- Function to update user stats on report submission
CREATE OR REPLACE FUNCTION update_user_stats_on_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, reports_submitted, safety_score)
  VALUES (NEW.user_id, 1, 3)
  ON CONFLICT (user_id) DO UPDATE SET
    reports_submitted = user_stats.reports_submitted + 1,
    safety_score = LEAST(100, 
      user_stats.total_scans * 5 + 
      user_stats.high_risk_avoided * 10 +
      (user_stats.reports_submitted + 1) * 3
    ),
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for community reports
CREATE TRIGGER update_user_stats_on_community_report
AFTER INSERT ON community_reports
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_report();
