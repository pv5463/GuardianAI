import { supabase } from './supabase';

export interface AnalyticsOverview {
  totalScans: number;
  highRiskPercentage: number;
  mostCommonScamType: string;
  estimatedLossPrevented: number;
}

export interface ScamTypeDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RiskTrendData {
  date: string;
  highRisk: number;
  medium: number;
  low: number;
}

export interface ThreatBreakdown {
  urgencyScore: number;
  impersonationScore: number;
  financialScore: number;
  technicalScore: number;
}

export interface UserSafetyScore {
  score: number;
  totalScans: number;
  reportsSubmitted: number;
  highRiskAvoided: number;
}

export async function getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: scans } = await supabase
    .from('scans')
    .select('risk_level, scam_type')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());

  const { data: voiceScans } = await supabase
    .from('voice_scans')
    .select('deepfake_score, scam_type')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());

  const allScans = [...(scans || []), ...(voiceScans || [])];
  const totalScans = allScans.length;
  
  const highRiskCount = allScans.filter(s => {
    if ('risk_level' in s) {
      return s.risk_level === 'high' || s.risk_level === 'critical';
    }
    if ('deepfake_score' in s) {
      return s.deepfake_score >= 60;
    }
    return false;
  }).length;

  const highRiskPercentage = totalScans > 0 ? Math.round((highRiskCount / totalScans) * 100) : 0;

  const scamTypeCounts: Record<string, number> = {};
  allScans.forEach(scan => {
    if (scan.scam_type) {
      scamTypeCounts[scan.scam_type] = (scamTypeCounts[scan.scam_type] || 0) + 1;
    }
  });

  const mostCommonScamType = Object.entries(scamTypeCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

  const estimatedLossPrevented = highRiskCount * 8000;

  return {
    totalScans,
    highRiskPercentage,
    mostCommonScamType,
    estimatedLossPrevented
  };
}

export async function getScamTypeDistribution(userId: string): Promise<ScamTypeDistribution[]> {
  const { data: scans } = await supabase
    .from('scans')
    .select('scam_type')
    .eq('user_id', userId);

  const { data: voiceScans } = await supabase
    .from('voice_scans')
    .select('scam_type')
    .eq('user_id', userId);

  const allScans = [...(scans || []), ...(voiceScans || [])];
  
  const scamTypeCounts: Record<string, number> = {};
  allScans.forEach(scan => {
    const type = scan.scam_type || 'Other';
    scamTypeCounts[type] = (scamTypeCounts[type] || 0) + 1;
  });

  const colors: Record<string, string> = {
    'UPI Fraud': '#ef4444',
    'Job Scam': '#f59e0b',
    'Bank Impersonation': '#8b5cf6',
    'Deepfake Call': '#ec4899',
    'OTP Theft': '#f97316',
    'Phishing': '#06b6d4',
    'Other': '#6b7280'
  };

  return Object.entries(scamTypeCounts).map(([name, value]) => ({
    name,
    value,
    color: colors[name] || '#6b7280'
  }));
}

export async function getRiskTrendData(userId: string): Promise<RiskTrendData[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: scans } = await supabase
    .from('scans')
    .select('created_at, risk_level')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  const trendData: Record<string, { highRisk: number; medium: number; low: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    trendData[dateStr] = { highRisk: 0, medium: 0, low: 0 };
  }

  (scans || []).forEach(scan => {
    const dateStr = scan.created_at.split('T')[0];
    if (trendData[dateStr]) {
      if (scan.risk_level === 'high' || scan.risk_level === 'critical') {
        trendData[dateStr].highRisk++;
      } else if (scan.risk_level === 'medium') {
        trendData[dateStr].medium++;
      } else {
        trendData[dateStr].low++;
      }
    }
  });

  return Object.entries(trendData).map(([date, counts]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...counts
  }));
}

export function calculateThreatBreakdown(text: string): ThreatBreakdown {
  const lowerText = text.toLowerCase();
  
  let urgencyScore = 0;
  let impersonationScore = 0;
  let financialScore = 0;
  let technicalScore = 0;

  const urgencyKeywords = ['immediately', 'urgent', 'now', 'within', 'expires', 'last chance', 'hurry'];
  const authorityKeywords = ['police', 'bank', 'government', 'officer', 'rbi', 'sbi', 'official'];
  const financialKeywords = ['pay', 'money', 'transfer', 'payment', 'fee', 'deposit', 'account'];
  const technicalKeywords = ['otp', 'password', 'pin', 'cvv', 'verify', 'confirm', 'update'];

  urgencyKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) urgencyScore += 15;
  });

  authorityKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) impersonationScore += 15;
  });

  financialKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) financialScore += 15;
  });

  technicalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) technicalScore += 15;
  });

  return {
    urgencyScore: Math.min(urgencyScore, 100),
    impersonationScore: Math.min(impersonationScore, 100),
    financialScore: Math.min(financialScore, 100),
    technicalScore: Math.min(technicalScore, 100)
  };
}

export function extractPsychologicalTactics(detectedFlags: string[]): string[] {
  const tactics: string[] = [];
  const flagsStr = detectedFlags.join(' ').toLowerCase();

  if (flagsStr.includes('urgency') || flagsStr.includes('immediately')) {
    tactics.push('Fear Manipulation');
  }
  if (flagsStr.includes('authority') || flagsStr.includes('impersonation')) {
    tactics.push('Authority Abuse');
  }
  if (flagsStr.includes('limited time') || flagsStr.includes('expires')) {
    tactics.push('Scarcity Pressure');
  }
  if (flagsStr.includes('secret') || flagsStr.includes('confidential')) {
    tactics.push('Confidentiality Request');
  }
  if (flagsStr.includes('emotional') || flagsStr.includes('family')) {
    tactics.push('Emotional Exploitation');
  }

  return [...new Set(tactics)];
}

export async function getUserSafetyScore(userId: string): Promise<UserSafetyScore> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!stats) {
    return {
      score: 0,
      totalScans: 0,
      reportsSubmitted: 0,
      highRiskAvoided: 0
    };
  }

  return {
    score: stats.safety_score || 0,
    totalScans: stats.total_scans || 0,
    reportsSubmitted: stats.reports_submitted || 0,
    highRiskAvoided: stats.high_risk_avoided || 0
  };
}

export async function getCommunityIntelligence() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: reports } = await supabase
    .from('community_reports')
    .select('scam_type, risk_level')
    .gte('created_at', twentyFourHoursAgo);

  const scamTypeCounts: Record<string, number> = {};
  let highRiskCount = 0;

  (reports || []).forEach(report => {
    scamTypeCounts[report.scam_type] = (scamTypeCounts[report.scam_type] || 0) + 1;
    if (report.risk_level === 'high' || report.risk_level === 'critical') {
      highRiskCount++;
    }
  });

  const trendingScamType = Object.entries(scamTypeCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

  const totalReports = reports?.length || 0;
  const highRiskPercentage = totalReports > 0 ? Math.round((highRiskCount / totalReports) * 100) : 0;

  return {
    trendingScamType,
    totalReports,
    highRiskPercentage,
    isHighAlert: highRiskPercentage > 60
  };
}

export async function saveScanToDatabase(
  userId: string,
  scanType: string,
  content: string,
  result: any
) {
  const breakdown = calculateThreatBreakdown(content);
  const tactics = extractPsychologicalTactics(result.redFlags || result.detectedFlags || []);

  const { error } = await supabase.from('scans').insert({
    user_id: userId,
    scan_type: scanType,
    content: content.substring(0, 500),
    scam_type: determineScamType(result, content),
    risk_level: result.riskLevel,
    scam_score: result.score || result.scamScore,
    urgency_score: breakdown.urgencyScore,
    impersonation_score: breakdown.impersonationScore,
    financial_score: breakdown.financialScore,
    technical_score: breakdown.technicalScore,
    detected_flags: tactics
  });

  if (error) console.error('Error saving scan:', error);
}

function determineScamType(result: any, content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('upi') || lowerContent.includes('@')) return 'UPI Fraud';
  if (lowerContent.includes('job') || lowerContent.includes('work from home')) return 'Job Scam';
  if (lowerContent.includes('bank') || lowerContent.includes('account')) return 'Bank Impersonation';
  if (lowerContent.includes('otp') || lowerContent.includes('verification code')) return 'OTP Theft';
  if (lowerContent.includes('http') || lowerContent.includes('link')) return 'Phishing';
  
  return 'Other';
}
