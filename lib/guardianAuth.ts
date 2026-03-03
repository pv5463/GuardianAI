import { supabase } from './supabase';
import { generateDeviceFingerprint } from './encryption';
import { detectLoginThreat } from './aiEngineClient';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  is_locked: boolean;
  failed_login_attempts: number;
}

export async function signUpWithRole(
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'analyst' | 'staff' = 'staff'
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', role)
    .single();

  if (roleData) {
    await supabase.from('user_profiles').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role_id: roleData.id,
      device_fingerprint: generateDeviceFingerprint()
    });
  }

  return authData;
}

export async function signInWithTracking(email: string, password: string) {
  const ipAddress = await getClientIP();
  const location = await getLocation();
  const deviceFingerprint = generateDeviceFingerprint();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, roles(name)')
    .eq('email', email)
    .single();

  if (profile?.is_locked) {
    throw new Error('Account is locked due to suspicious activity. Please contact support.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    await logFailedLogin(profile?.id, ipAddress, location, deviceFingerprint);
    
    if (profile) {
      const newAttempts = (profile.failed_login_attempts || 0) + 1;
      await supabase
        .from('user_profiles')
        .update({
          failed_login_attempts: newAttempts,
          last_failed_login: new Date().toISOString(),
          is_locked: newAttempts >= 5
        })
        .eq('id', profile.id);

      // Trigger threat detection for suspicious login patterns
      await detectLoginThreats(profile.id, newAttempts, ipAddress, location);
    }
    
    throw error;
  }

  await logSuccessfulLogin(data.user.id, ipAddress, location, deviceFingerprint);
  
  // Check for suspicious login patterns even on successful login
  if (profile) {
    await checkSuspiciousLoginPatterns(data.user.id, ipAddress, location);
  }
  
  await supabase
    .from('user_profiles')
    .update({
      failed_login_attempts: 0,
      last_failed_login: null
    })
    .eq('id', data.user.id);

  return data;
}

async function logSuccessfulLogin(
  userId: string,
  ipAddress: string,
  location: string,
  deviceFingerprint: string
) {
  await supabase.from('login_logs').insert({
    user_id: userId,
    ip_address: ipAddress,
    location,
    success: true,
    device_fingerprint: deviceFingerprint,
    risk_score: 0
  });
}

async function logFailedLogin(
  userId: string | undefined,
  ipAddress: string,
  location: string,
  deviceFingerprint: string
) {
  if (!userId) return;
  
  await supabase.from('login_logs').insert({
    user_id: userId,
    ip_address: ipAddress,
    location,
    success: false,
    device_fingerprint: deviceFingerprint,
    risk_score: 50
  });
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function getLocation(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return `${data.city}, ${data.country_name}` || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select(`
      id,
      email,
      full_name,
      department,
      is_locked,
      failed_login_attempts,
      roles(name)
    `)
    .eq('id', userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: (data.roles as any)?.name || 'staff',
    department: data.department,
    is_locked: data.is_locked,
    failed_login_attempts: data.failed_login_attempts
  };
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('roles(permissions)')
    .eq('id', userId)
    .single();

  if (!data) return false;

  const permissions = (data.roles as any)?.permissions || {};
  return permissions.all === true || permissions[permission] === true;
}

/**
 * Detect login threats using AI Engine
 */
async function detectLoginThreats(
  userId: string,
  failedAttempts: number,
  ipAddress: string,
  location: string
) {
  try {
    const { data: previousLogins } = await supabase
      .from('login_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastLogin = previousLogins?.[0];
    
    let loginGapMinutes = 0;
    if (lastLogin) {
      const lastLoginTime = new Date(lastLogin.created_at).getTime();
      const currentTime = new Date().getTime();
      loginGapMinutes = Math.floor((currentTime - lastLoginTime) / (1000 * 60));
    }

    const countryChanged = lastLogin && lastLogin.location !== location;

    const roleAccessAttempt = 0;

    const threatData = {
      failed_attempts: failedAttempts,
      country_changed: countryChanged || false,
      role_access_attempt: roleAccessAttempt,
      login_gap_minutes: loginGapMinutes
    };

    console.log('Detecting login threat:', threatData);

    const result = await detectLoginThreat(userId, threatData);

    console.log('Threat detection result:', result);

    if (result.risk_score > 60) {
      console.warn(`High-risk login detected for user ${userId}:`, result);
      
      await sendSecurityAlert(userId, result);
    }

  } catch (error) {
    console.error('Error detecting login threats:', error);
  }
}

async function checkSuspiciousLoginPatterns(
  userId: string,
  ipAddress: string,
  location: string
) {
  try {
    const { data: recentLogins } = await supabase
      .from('login_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentLogins || recentLogins.length < 2) return;

    const lastLogin = recentLogins[1];
    
    if (lastLogin && lastLogin.location !== location) {
      const lastLoginTime = new Date(lastLogin.created_at).getTime();
      const currentTime = new Date().getTime();
      const minutesDiff = (currentTime - lastLoginTime) / (1000 * 60);

      if (minutesDiff < 60) {
        console.warn(`Impossible travel detected for user ${userId}`);
        
        await detectLoginThreat(userId, {
          failed_attempts: 0,
          country_changed: true,
          role_access_attempt: 0,
          login_gap_minutes: Math.floor(minutesDiff)
        });
      }
    }

    const uniqueIPs = new Set(recentLogins.map(l => l.ip_address));
    if (uniqueIPs.size >= 3) {
      console.warn(`Multiple IPs detected for user ${userId}`);
      
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: 'multiple_ip_login',
        severity: 'medium',
        source_ip: ipAddress,
        description: `Login from ${uniqueIPs.size} different IP addresses in recent history`,
        risk_score: 55,
        indicators: Array.from(uniqueIPs),
        status: 'active'
      });
    }

  } catch (error) {
    console.error('Error checking suspicious patterns:', error);
  }
}

async function sendSecurityAlert(userId: string, threatResult: any) {
  try {
    console.log(`Security Alert for user ${userId}:`, {
      risk_score: threatResult.risk_score,
      classification: threatResult.classification,
      explanation: threatResult.explanation
    });

  } catch (error) {
    console.error('Error sending security alert:', error);
  }
}
