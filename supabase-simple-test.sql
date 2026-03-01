-- Simple Test Data for GuardianAI
-- This creates threats and incidents directly

-- First, clear any existing test data
DELETE FROM incident_reports WHERE title LIKE 'Auto-generated:%' OR title LIKE 'Test Incident%';
DELETE FROM threat_logs WHERE description LIKE '%test%' OR description LIKE '%Brute force%';

-- Insert test threats
INSERT INTO threat_logs (threat_type, severity, source_ip, description, risk_score, indicators, status)
VALUES 
  (
    'brute_force',
    'critical',
    '192.168.1.100',
    'Brute force attack detected: 6 failed login attempts',
    95,
    '["6 failed login attempts", "Source IP: 192.168.1.100"]'::jsonb,
    'active'
  ),
  (
    'suspicious_login',
    'high',
    '203.0.113.45',
    'Suspicious login from unusual location',
    85,
    '["Unusual location", "IP change detected"]'::jsonb,
    'active'
  ),
  (
    'unusual_time',
    'medium',
    '10.0.0.25',
    'Login at unusual time detected',
    60,
    '["Login at 3:00 AM", "Outside normal hours"]'::jsonb,
    'investigating'
  );

-- Manually insert incidents (in case trigger doesn't work)
INSERT INTO incident_reports (
  title,
  description,
  severity,
  status,
  mitigation_steps
)
VALUES 
  (
    'Test Incident 1: Critical Brute Force',
    'Multiple failed login attempts detected from single IP address',
    'critical',
    'open',
    '["Lock affected account", "Reset password", "Enable 2FA", "Block IP address"]'::jsonb
  ),
  (
    'Test Incident 2: Suspicious Login',
    'User logged in from unusual location',
    'high',
    'investigating',
    '["Verify user identity", "Check device fingerprint", "Monitor activity"]'::jsonb
  ),
  (
    'Test Incident 3: Unusual Activity',
    'Login detected outside normal business hours',
    'medium',
    'open',
    '["Contact user", "Review activity logs", "Enable alerts"]'::jsonb
  );

-- Verify data was inserted
SELECT 'Threats inserted:' as message, COUNT(*) as count FROM threat_logs;
SELECT 'Incidents inserted:' as message, COUNT(*) as count FROM incident_reports;

-- Show the data
SELECT id, threat_type, severity, status FROM threat_logs ORDER BY created_at DESC LIMIT 5;
SELECT id, title, severity, status FROM incident_reports ORDER BY created_at DESC LIMIT 5;
