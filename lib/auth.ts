import { supabase } from './supabase';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function checkPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  if (password.length >= 8) score += 25;
  else feedback.push('Use at least 8 characters');
  
  if (password.length >= 12) score += 15;
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  else feedback.push('Include both uppercase and lowercase letters');
  
  if (/\d/.test(password)) score += 20;
  else feedback.push('Include at least one number');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  else feedback.push('Include at least one special character');
  
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 40) strength = 'weak';
  else if (score < 70) strength = 'medium';
  else strength = 'strong';
  
  return { strength, score, feedback };
}
