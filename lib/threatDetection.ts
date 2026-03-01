// Real-time Threat Detection Engine for GuardianAI

import { supabase } from './supabase';

export interface ThreatDetectionResult {
  isThreat: boolean;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  indicators: string[];
  description: string;
}

export async function detectBruteForceAttack(
  userId: string,
  ipAddress: string
): Promise<ThreatDetectionResult | null> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: recentFailedLogins } = await supabase
    .from('login_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('success', false)
    .gte('login_time', fiveMinutesAgo);
  
  if (recentFailedLogins && recentFailedLogins.length >= 5) {
    return {
      isThreat: true,
      threatType: 'brute_force',
      severity: 'critical',
      riskScore: 95,
      indicators: [
        `${recentFailedLogins.length} failed login attempts in 5 minutes`,
        `Source IP: ${ipAddress}`,
        'Potential credential stuffing attack'
      ],
      description: `Brute force attack detected: ${recentFailedLogins.length} failed login attempts from ${ipAddress} in the last 5 minutes`
    };
  }
  
  return null;
}

export async function detectSuspiciousIPChange(
  userId: string,
  currentIP: string,
  currentLocation: string
): Promise<ThreatDetectionResult | null> {
  const { data: recentLogins } = await supabase
    .from('login_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('success', true)
    .order('login_time', { ascending: false })
    .limit(5);
  
  if (recentLogins && recentLogins.length > 0) {
    const lastLogin = recentLogins[0];
    const lastIP = lastLogin.ip_address;
    const lastLocation = lastLogin.location;
    
    if (lastIP !== currentIP && lastLocation !== currentLocation) {
      const timeDiff = new Date().getTime() - new Date(lastLogin.login_time).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 1) {
        return {
          isThreat: true,
          threatType: 'suspicious_login',
          severity: 'high',
          riskScore: 85,
          indicators: [
            `IP changed from ${lastIP} to ${currentIP}`,
            `Location changed from ${lastLocation} to ${currentLocation}`,
            `Time difference: ${Math.round(hoursDiff * 60)} minutes`,
            'Impossible travel detected'
          ],
          description: `Suspicious login: User location changed from ${lastLocation} to ${currentLocation} in ${Math.round(hoursDiff * 60)} minutes`
        };
      }
    }
  }
  
  return null;
}

export async function detectUnusualLoginTime(
  userId: string
): Promise<ThreatDetectionResult | null> {
  const currentHour = new Date().getHours();
  
  const { data: historicalLogins } = await supabase
    .from('login_logs')
    .select('login_time')
    .eq('user_id', userId)
    .eq('success', true)
    .limit(50);
  
  if (historicalLogins && historicalLogins.length >= 10) {
    const loginHours = historicalLogins.map(log => new Date(log.login_time).getHours());
    const avgHour = loginHours.reduce((a, b) => a + b, 0) / loginHours.length;
    const hourDiff = Math.abs(currentHour - avgHour);
    
    if (hourDiff > 8) {
      return {
        isThreat: true,
        threatType: 'unusual_time',
        severity: 'medium',
        riskScore: 60,
        indicators: [
          `Login at ${currentHour}:00 (unusual time)`,
          `Typical login time: ${Math.round(avgHour)}:00`,
          'Outside normal activity pattern'
        ],
        description: `Unusual login time detected: User typically logs in around ${Math.round(avgHour)}:00, but logged in at ${currentHour}:00`
      };
    }
  }
  
  return null;
}

export async function detectRapidRequests(
  userId: string,
  ipAddress: string
): Promise<ThreatDetectionResult | null> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data: recentRequests } = await supabase
    .from('login_logs')
    .select('*')
    .eq('ip_address', ipAddress)
    .gte('login_time', oneMinuteAgo);
  
  if (recentRequests && recentRequests.length > 20) {
    return {
      isThreat: true,
      threatType: 'rapid_requests',
      severity: 'high',
      riskScore: 80,
      indicators: [
        `${recentRequests.length} requests in 1 minute`,
        `Source IP: ${ipAddress}`,
        'Potential DDoS or automated attack'
      ],
      description: `Rapid request burst detected: ${recentRequests.length} requests from ${ipAddress} in the last minute`
    };
  }
  
  return null;
}

export async function logThreat(
  threat: ThreatDetectionResult,
  userId: string | null,
  ipAddress: string,
  metadata: any = {}
): Promise<void> {
  await supabase.from('threat_logs').insert({
    threat_type: threat.threatType,
    severity: threat.severity,
    source_ip: ipAddress,
    target_user_id: userId,
    description: threat.description,
    risk_score: threat.riskScore,
    indicators: threat.indicators,
    metadata
  });
}

export async function runThreatDetection(
  userId: string,
  ipAddress: string,
  location: string
): Promise<ThreatDetectionResult[]> {
  const threats: ThreatDetectionResult[] = [];
  
  const bruteForce = await detectBruteForceAttack(userId, ipAddress);
  if (bruteForce) threats.push(bruteForce);
  
  const suspiciousIP = await detectSuspiciousIPChange(userId, ipAddress, location);
  if (suspiciousIP) threats.push(suspiciousIP);
  
  const unusualTime = await detectUnusualLoginTime(userId);
  if (unusualTime) threats.push(unusualTime);
  
  const rapidRequests = await detectRapidRequests(userId, ipAddress);
  if (rapidRequests) threats.push(rapidRequests);
  
  for (const threat of threats) {
    await logThreat(threat, userId, ipAddress);
  }
  
  return threats;
}
