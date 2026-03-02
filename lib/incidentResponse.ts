// Automated Incident Response System for GuardianAI
import { supabase } from './supabase';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affected_user_id: string | null;
  mitigation_steps: string[];
  created_at: string;
  updated_at: string;
}

export async function createIncident(
  threatLogId: string,
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  affectedUserId: string | null,
  mitigationSteps: string[]
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incident_reports')
    .insert({
      threat_log_id: threatLogId,
      title,
      description,
      severity,
      affected_user_id: affectedUserId,
      mitigation_steps: mitigationSteps,
      status: 'open'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getIncidents(
  status?: string,
  severity?: string,
  limit: number = 50
) {
  try {
    let query = supabase
      .from('incident_reports')
      .select(`
        *,
        threat_logs(threat_type, risk_score)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('getIncidents error:', error);
    throw error;
  }
}

export async function updateIncidentStatus(
  incidentId: string,
  status: 'open' | 'investigating' | 'resolved' | 'closed',
  resolutionNotes?: string
) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      if (resolutionNotes) {
        updateData.resolution_notes = resolutionNotes;
      }
    }

    console.log('Updating incident:', incidentId, 'with data:', updateData);

    const { data, error } = await supabase
      .from('incident_reports')
      .update(updateData)
      .eq('id', incidentId)
      .select()
      .single();

    if (error) {
      console.error('Update incident error:', error);
      throw error;
    }
    
    console.log('Incident updated successfully:', data);
    return data;
  } catch (error) {
    console.error('updateIncidentStatus error:', error);
    throw error;
  }
}

export async function assignIncident(incidentId: string, analystId: string) {
  const { data, error } = await supabase
    .from('incident_reports')
    .update({
      assigned_to: analystId,
      status: 'investigating',
      updated_at: new Date().toISOString()
    })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getIncidentStats() {
  const { data: incidents } = await supabase
    .from('incident_reports')
    .select('severity, status, created_at');

  if (!incidents) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
    todayCount: incidents.filter(i => new Date(i.created_at) >= today).length
  };
}

export function generateMitigationSteps(
  threatType: string,
  severity: string
): string[] {
  const baseMitigation = [
    'Document all evidence and logs',
    'Notify security team immediately',
    'Monitor affected systems closely'
  ];

  const threatSpecific: Record<string, string[]> = {
    brute_force: [
      'Lock affected user account immediately',
      'Force password reset for user',
      'Enable two-factor authentication',
      'Block source IP address',
      'Review all recent login attempts',
      'Check for compromised credentials'
    ],
    suspicious_login: [
      'Verify user identity through secondary channel',
      'Check device fingerprint against known devices',
      'Review login location and IP history',
      'Enable additional verification steps',
      'Monitor account activity for 24 hours'
    ],
    privilege_escalation: [
      'Immediately revoke elevated privileges',
      'Audit all permission changes',
      'Review user activity logs',
      'Check for unauthorized access',
      'Reset user credentials',
      'Conduct security assessment'
    ],
    rapid_requests: [
      'Implement rate limiting',
      'Block source IP temporarily',
      'Analyze request patterns',
      'Check for DDoS indicators',
      'Enable CAPTCHA if needed'
    ],
    phishing_attempt: [
      'Block malicious URLs/domains',
      'Notify affected users',
      'Update email filters',
      'Conduct security awareness training',
      'Report to threat intelligence feeds'
    ]
  };

  const steps = threatSpecific[threatType] || [
    'Investigate threat thoroughly',
    'Contain affected systems',
    'Implement security controls',
    'Review and update policies'
  ];

  if (severity === 'critical' || severity === 'high') {
    steps.unshift('URGENT: Immediate action required');
  }

  return [...steps, ...baseMitigation];
}
