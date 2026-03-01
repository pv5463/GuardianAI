-- Voice Scans Table
CREATE TABLE voice_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  scam_score INTEGER NOT NULL,
  deepfake_score INTEGER NOT NULL,
  detected_flags JSONB DEFAULT '[]'::jsonb,
  audio_duration FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Reports Table
CREATE TABLE community_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scam_type TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE voice_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Voice Scans Policies
CREATE POLICY "Users can read their own voice scans"
  ON voice_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice scans"
  ON voice_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Community Reports Policies
CREATE POLICY "Anyone can read community reports"
  ON community_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own reports"
  ON community_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE community_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_scans;

-- Create indexes for performance
CREATE INDEX idx_voice_scans_user_id ON voice_scans(user_id);
CREATE INDEX idx_voice_scans_created_at ON voice_scans(created_at DESC);
CREATE INDEX idx_community_reports_created_at ON community_reports(created_at DESC);
CREATE INDEX idx_community_reports_scam_type ON community_reports(scam_type);
