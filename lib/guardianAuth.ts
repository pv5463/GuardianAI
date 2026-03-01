// Enhanced Authentication System for GuardianAI
import { supabase } from './supabase';
import { generateDeviceFingerprint } from './encryption';

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
    }
    
    throw error;
  }

  await logSuccessfulLogin(data.user.id, ipAddress, location, deviceFingerprint);
  
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
