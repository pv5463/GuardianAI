/**
 * Login Threat Monitor - Real-time monitoring of login attempts
 * Automatically detects and responds to suspicious login patterns
 */

import { supabase } from './supabase';
import { detectLoginThreat } from './aiEngineClient';

export interface LoginAttempt {
  email: string;
  success: boolean;
  ipAddress: string;
  location: string;
  timestamp: Date;
}

// In-memory cache for tracking recent attempts (per session)
const recentAttempts = new Map<string, LoginAttempt[]>();

/**
 * Track login attempt and detect threats
 */
export async function trackLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string,
  location: string
): Promise<void> {
  const attempt: LoginAttempt = {
    email,
    success,
    ipAddress,
    location,
    timestamp: new Date()
  };

  // Add to recent attempts
  const attempts = recentAttempts.get(email) || [];
  attempts.push(attempt);
  
  // Keep only last 10 attempts
  if (attempts.length > 10) {
    attempts.shift();
  }
  recentAttempts.set(email, attempts);

  // Analyze if failed login
  if (!success) {
    await analyzeFailedLogin(email, attempts);
  }
}

/**
 * Analyze failed login attempts
 */
async function analyzeFailedLogin(email: string, attempts: LoginAttempt[]): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, failed_login_attempts')
      .eq('email', email)
      .single();

    if (!profile) return;

    // Count recent failed attempts (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentFailures = attempts.filter(
      a => !a.success && a.timestamp > fifteenMinutesAgo
    ).length;

    // Trigger threat detection if 3+ failed attempts
    if (recentFailures >= 3) {
      console.warn(`Multiple failed login attempts detected for ${email}: ${recentFailures} attempts`);
      
      // Get last successful login for comparison
      const { data: lastSuccess } = await supabase
        .from('login_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate metrics
      const loginGapMinutes = lastSuccess
        ? Math.floor((Date.now() - new Date(lastSuccess.created_at).getTime()) / (1000 * 60))
        : 0;

      const currentLocation = attempts[attempts.length - 1].location;
      const countryChanged = lastSuccess && lastSuccess.location !== currentLocation;

      // Call AI Engine
      await detectLoginThreat(profile.id, {
        failed_attempts: recentFailures,
        country_changed: countryChanged || false,
        role_access_attempt: 0,
        login_gap_minutes: loginGapMinutes
      });
    }

    // Auto-lock account after 5 failed attempts
    if (recentFailures >= 5) {
      await supabase
        .from('user_profiles')
        .update({ is_locked: true })
        .eq('id', profile.id);

      console.error(`Account locked for ${email} due to ${recentFailures} failed attempts`);
    }

  } catch (error) {
    console.error('Error analyzing failed login:', error);
  }
}

/**
 * Check for brute force attacks across all users
 */
export async function detectBruteForceAttacks(): Promise<void> {
  try {
    // Get failed login attempts in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentFailures } = await supabase
      .from('login_logs')
      .select('ip_address, user_id')
      .eq('success', false)
      .gte('created_at', fiveMinutesAgo);

    if (!recentFailures || recentFailures.length === 0) return;

    // Group by IP address
    const ipCounts = new Map<string, number>();
    recentFailures.forEach(log => {
      ipCounts.set(log.ip_address, (ipCounts.get(log.ip_address) || 0) + 1);
    });

    // Detect IPs with 10+ failed attempts
    for (const [ip, count] of ipCounts.entries()) {
      if (count >= 10) {
        console.warn(`Brute force attack detected from IP ${ip}: ${count} failed attempts`);
        
        // Create threat log
        await supabase.from('threat_logs').insert({
          threat_type: 'brute_force_attack',
          severity: 'critical',
          source_ip: ip,
          description: `Brute force attack detected: ${count} failed login attempts from ${ip} in 5 minutes`,
          risk_score: 95,
          indicators: [`${count} failed attempts`, `IP: ${ip}`, 'Multiple accounts targeted'],
          status: 'active'
        });
      }
    }

  } catch (error) {
    console.error('Error detecting brute force attacks:', error);
  }
}

/**
 * Clear old attempts from memory (call periodically)
 */
export function clearOldAttempts(): void {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  for (const [email, attempts] of recentAttempts.entries()) {
    const filtered = attempts.filter(a => a.timestamp > thirtyMinutesAgo);
    
    if (filtered.length === 0) {
      recentAttempts.delete(email);
    } else {
      recentAttempts.set(email, filtered);
    }
  }
}

/**
 * Get recent login attempts for an email
 */
export function getRecentAttempts(email: string): LoginAttempt[] {
  return recentAttempts.get(email) || [];
}

/**
 * Start periodic monitoring
 */
export function startThreatMonitoring(): void {
  // Check for brute force attacks every minute
  setInterval(() => {
    detectBruteForceAttacks();
  }, 60 * 1000);

  // Clear old attempts every 5 minutes
  setInterval(() => {
    clearOldAttempts();
  }, 5 * 60 * 1000);

  console.log('Login threat monitoring started');
}
