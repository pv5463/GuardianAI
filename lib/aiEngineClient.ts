import { supabase } from './supabase';

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';

export interface AIEngineResponse {
  risk_score: number;
  risk_level: string;
  classification: string;
  explanation: string[];
  incident_required: boolean;
  probability?: number;
}

export async function checkAIEngineHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_ENGINE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('AI Engine health check failed:', error);
    return false;
  }
}

export async function detectLoginThreat(
  userId: string,
  loginData: {
    failed_attempts: number;
    country_changed: boolean;
    role_access_attempt: number;
    login_gap_minutes: number;
  }
): Promise<AIEngineResponse> {
  try {
    // Call AI Engine
    const response = await fetch(`${AI_ENGINE_URL}/predict/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      throw new Error(`AI Engine error: ${response.statusText}`);
    }

    const result: AIEngineResponse = await response.json();

    // Store in Supabase for real-time access
    if (result.risk_score > 30) {
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: result.classification,
        severity: result.risk_level.toLowerCase(),
        source_ip: 'system',
        description: result.explanation.join('. '),
        risk_score: result.risk_score,
        indicators: result.explanation,
        status: 'active',
      });

      // Create incident if required
      if (result.incident_required) {
        await createIncidentFromThreat(userId, result, 'login');
      }
    }

    return result;
  } catch (error) {
    console.error('Login threat detection failed:', error);
    throw error;
  }
}

export async function detectPhishingURL(
  userId: string,
  url: string
): Promise<AIEngineResponse> {
  try {
    // Call AI Engine
    const response = await fetch(`${AI_ENGINE_URL}/predict/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`AI Engine error: ${response.statusText}`);
    }

    const result: AIEngineResponse = await response.json();

    // Store in Supabase
    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: url,
      content_type: 'url',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'phishing',
    });

    // Create threat log if high risk
    if (result.risk_score > 50) {
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: 'phishing_url',
        severity: result.risk_level.toLowerCase(),
        source_ip: 'user_submitted',
        description: `Phishing URL detected: ${url}`,
        risk_score: result.risk_score,
        indicators: result.explanation,
        status: 'active',
      });

      if (result.incident_required) {
        await createIncidentFromThreat(userId, result, 'url', url);
      }
    }

    return result;
  } catch (error) {
    console.error('URL detection failed:', error);
    throw error;
  }
}

export async function detectSMSScam(
  userId: string,
  text: string
): Promise<AIEngineResponse> {
  try {
    // Call AI Engine
    const response = await fetch(`${AI_ENGINE_URL}/predict/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`AI Engine error: ${response.statusText}`);
    }

    const result: AIEngineResponse = await response.json();

    // Store in Supabase
    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: text,
      content_type: 'sms',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'scam',
    });

    // Create threat log if high risk
    if (result.risk_score > 50) {
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: 'sms_scam',
        severity: result.risk_level.toLowerCase(),
        source_ip: 'user_submitted',
        description: `SMS scam detected: ${text.substring(0, 100)}...`,
        risk_score: result.risk_score,
        indicators: result.explanation,
        status: 'active',
      });

      if (result.incident_required) {
        await createIncidentFromThreat(userId, result, 'sms', text);
      }
    }

    return result;
  } catch (error) {
    console.error('SMS detection failed:', error);
    throw error;
  }
}

async function createIncidentFromThreat(
  userId: string,
  result: AIEngineResponse,
  type: string,
  content?: string
) {
  try {
    // Get the latest threat log for this user
    const { data: threatLog } = await supabase
      .from('threat_logs')
      .select('id')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(1)
      .single();

    if (!threatLog) return;

    // Generate mitigation steps based on type
    const mitigationSteps = generateMitigationSteps(type, result);

    // Create incident
    await supabase.from('incident_reports').insert({
      threat_log_id: threatLog.id,
      title: `${result.classification.toUpperCase()} - ${type.toUpperCase()} Threat Detected`,
      description: result.explanation.join('. '),
      severity: result.risk_level.toLowerCase(),
      status: 'open',
      affected_user_id: userId,
      mitigation_steps: mitigationSteps,
    });
  } catch (error) {
    console.error('Failed to create incident:', error);
  }
}

function generateMitigationSteps(type: string, result: AIEngineResponse): string[] {
  const baseSteps = [
    'Document all evidence and logs',
    'Monitor affected systems closely',
    'Review security policies',
  ];

  const typeSpecificSteps: Record<string, string[]> = {
    login: [
      'Lock affected user account immediately',
      'Force password reset',
      'Enable two-factor authentication',
      'Review recent login attempts',
      'Check for compromised credentials',
    ],
    url: [
      'Block malicious URL/domain',
      'Notify affected users',
      'Update email/web filters',
      'Report to threat intelligence feeds',
      'Conduct security awareness training',
    ],
    sms: [
      'Block sender number',
      'Report to telecom provider',
      'Warn users about similar scams',
      'Update SMS filtering rules',
      'Document scam pattern',
    ],
  };

  const steps = typeSpecificSteps[type] || [];
  
  if (result.risk_score > 80) {
    steps.unshift('🚨 CRITICAL: Immediate action required');
  }

  return [...steps, ...baseSteps];
}

export async function getUserThreats(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('threat_logs')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUserAnalysisHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('phishing_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUserIncidents(userId: string, status?: string) {
  let query = supabase
    .from('incident_reports')
    .select(`
      *,
      threat_logs(threat_type, risk_score)
    `)
    .eq('affected_user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export function subscribeToUserThreats(
  userId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`user_threats_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'threat_logs',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

export function subscribeToUserIncidents(
  userId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`user_incidents_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incident_reports',
        filter: `affected_user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}
