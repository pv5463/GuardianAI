-- Guardian AI Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create scam_reports table
CREATE TABLE IF NOT EXISTS scam_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'url', 'upi', 'screenshot')),
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scam_reports_created_at ON scam_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_reports_risk_level ON scam_reports(risk_level);
CREATE INDEX IF NOT EXISTS idx_scam_reports_user_id ON scam_reports(user_id);

-- Enable Row Level Security
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read scam reports" ON scam_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON scam_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON scam_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON scam_reports;

-- Policy: Anyone authenticated can read all reports
CREATE POLICY "Authenticated users can read scam reports"
  ON scam_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert their own reports"
  ON scam_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own reports"
  ON scam_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete their own reports"
  ON scam_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_scam_reports_updated_at ON scam_reports;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scam_reports_updated_at
  BEFORE UPDATE ON scam_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for scam_reports table
ALTER PUBLICATION supabase_realtime ADD TABLE scam_reports;

-- Insert some sample data (optional - for testing)
-- Note: This will only work after you've created at least one user account
-- You can run this later after signing up

-- INSERT INTO scam_reports (user_id, type, description, risk_level, score)
-- VALUES
--   (auth.uid(), 'text', 'Received SMS claiming to be from bank asking for OTP', 'critical', 95),
--   (auth.uid(), 'url', 'Suspicious link pretending to be Amazon', 'high', 78),
--   (auth.uid(), 'upi', 'Unknown UPI ID requesting money', 'medium', 55),
--   (auth.uid(), 'text', 'Lottery winner notification with suspicious link', 'high', 82),
--   (auth.uid(), 'url', 'Phishing website mimicking PayPal', 'critical', 98);

-- Verify setup
SELECT 'Setup complete! Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'scam_reports';

SELECT 'Policies created:' as status;
SELECT policyname FROM pg_policies WHERE tablename = 'scam_reports';
