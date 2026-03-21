/**
 * AI Engine Client - Connects Next.js frontend to Python AI backend
 * Handles real-time threat detection and analysis with user-specific data storage
 */

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

export interface AdvancedThreatResponse {
  risk_score: number;
  risk_level: string;
  classification: string;
  explanation: string[];
  incident_required: boolean;
  probability?: number;
  threats_detected?: string[];
  recommendations?: string[];
  details?: {
    typosquatting?: {
      similar_to: string;
      similarity_score: number;
      warning: string;
    };
    ml_analysis?: any;
    reputation?: any;
  };
}

export interface DeepfakeAnalysisResponse {
  risk_score: number;
  risk_level: string;
  classification: string;
  explanation: string[];
  incident_required: boolean;
  threats_detected?: string[];
  recommendations?: string[];
  details?: {
    detections: any[];
    pattern_analysis: any;
  };
}

export interface EmailPhishingResponse {
  risk_score: number;
  risk_level: string;
  classification: string;
  explanation: string[];
  keywords_detected: string[];
  links_found: number;
  links: string[];
  recommended_action: string;
  features?: any;
}

/**
 * Check if AI Engine is available
 */
export async function checkAIEngineHealth(): Promise<boolean> {
  try {
    console.log('🏥 Checking AI Engine at:', AI_ENGINE_URL);
    const response = await fetch(`${AI_ENGINE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('📡 Health check response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Health check failed with status:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('📊 Health check data:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ AI Engine health check failed:', error);
    return false;
  }
}

/**
 * Detect login threats using AI Engine
 * Stores results in Supabase for user
 */
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

/**
 * Detect phishing URLs using AI Engine
 * Stores results in Supabase for user
 */
export async function detectPhishingURL(
  userId: string,
  url: string
): Promise<AIEngineResponse> {
  try {
    console.log('🌐 Calling AI Engine URL detection for:', url);
    
    const response = await fetch(`${AI_ENGINE_URL}/predict/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    console.log('📡 URL detection response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Engine error response:', errorText);
      throw new Error(`AI Engine error: ${response.statusText}`);
    }

    const result: AIEngineResponse = await response.json();
    console.log('✅ URL detection result:', result);

    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: url,
      content_type: 'url',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'phishing',
    });

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
    console.error('❌ URL detection failed:', error);
    throw error;
  }
}

/**
 * Advanced URL analysis with typosquatting detection and reputation checks
 */
export async function detectAdvancedPhishingURL(
  userId: string,
  url: string,
  includeReputationCheck: boolean = true
): Promise<AdvancedThreatResponse> {
  try {
    console.log('🔍 Calling Advanced AI Engine URL detection for:', url);
    
    const response = await fetch(`${AI_ENGINE_URL}/predict/url/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url,
        include_reputation_check: includeReputationCheck 
      }),
    });

    console.log('📡 Advanced URL detection response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Advanced AI Engine error response:', errorText);
      throw new Error(`AI Engine error: ${response.statusText}`);
    }

    const result: AdvancedThreatResponse = await response.json();
    console.log('✅ Advanced URL detection result:', result);

    // Store enhanced analysis in Supabase
    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: url,
      content_type: 'url_advanced',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'dangerous' || result.classification === 'phishing',
      analysis_details: {
        threats_detected: result.threats_detected,
        recommendations: result.recommendations,
        typosquatting: result.details?.typosquatting,
        reputation_check: result.details?.reputation
      }
    });

    // Create threat log for high-risk URLs
    if (result.risk_score > 50) {
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: 'advanced_phishing_url',
        severity: result.risk_level.toLowerCase(),
        source_ip: 'user_submitted',
        description: `Advanced phishing analysis: ${url} - ${result.threats_detected?.join(', ') || 'Multiple threats'}`,
        risk_score: result.risk_score,
        indicators: result.explanation,
        status: 'active',
        metadata: {
          typosquatting: result.details?.typosquatting,
          threats: result.threats_detected
        }
      });

      if (result.incident_required) {
        await createAdvancedIncidentFromThreat(userId, result, 'advanced_url', url);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Advanced URL detection failed:', error);
    throw error;
  }
}

/**
 * Analyze uploaded image for deepfake and dark patterns
 */
export async function detectDeepfakePatterns(
  userId: string,
  imageFile: File
): Promise<DeepfakeAnalysisResponse> {
  try {
    console.log('🖼️ Calling AI Engine deepfake detection for image:', imageFile.name);
    
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${AI_ENGINE_URL}/predict/deepfake`, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Deepfake detection response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepfake AI Engine error response:', errorText);
      throw new Error(`AI Engine error: ${response.statusText}`);
    }

    const result: DeepfakeAnalysisResponse = await response.json();
    console.log('✅ Deepfake detection result:', result);

    // Store analysis in Supabase
    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: imageFile.name,
      content_type: 'image_deepfake',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'dangerous' || result.classification === 'suspicious',
      analysis_details: {
        threats_detected: result.threats_detected,
        recommendations: result.recommendations,
        detections: result.details?.detections,
        pattern_analysis: result.details?.pattern_analysis
      }
    });

    // Create threat log for suspicious images
    if (result.risk_score > 40) {
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: 'deepfake_dark_pattern',
        severity: result.risk_level.toLowerCase(),
        source_ip: 'user_submitted',
        description: `Deepfake/dark pattern analysis: ${imageFile.name} - ${result.threats_detected?.join(', ') || 'Suspicious patterns detected'}`,
        risk_score: result.risk_score,
        indicators: result.explanation,
        status: 'active',
        metadata: {
          image_name: imageFile.name,
          threats: result.threats_detected,
          pattern_analysis: result.details?.pattern_analysis
        }
      });

      if (result.incident_required) {
        await createAdvancedIncidentFromThreat(userId, result, 'deepfake', imageFile.name);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Deepfake detection failed:', error);
    throw error;
  }
}

/**
 * Train malicious URL model using Kaggle dataset
 */
export async function trainMaliciousURLModel(): Promise<{
  status: string;
  message: string;
  accuracy?: number;
  samples_trained?: number;
  top_features?: Array<[string, number]>;
}> {
  try {
    console.log('🎓 Initiating malicious URL model training...');
    
    const response = await fetch(`${AI_ENGINE_URL}/train/malicious-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('📡 Training response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Training error response:', errorText);
      throw new Error(`Training failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Training completed:', result);

    return result;
  } catch (error) {
    console.error('❌ Model training failed:', error);
    throw error;
  }
}

/**
 * Analyze deepfake dataset for patterns
 */
export async function analyzeDeepfakeDataset(): Promise<{
  status: string;
  analysis: {
    total_analyzed: number;
    classifications: Record<string, number>;
    average_risk_score: number;
    sample_results: Array<{
      file: string;
      risk_score: number;
      classification: string;
      elements_detected: number;
    }>;
  };
  message: string;
}> {
  try {
    console.log('📊 Analyzing deepfake dataset...');
    
    const response = await fetch(`${AI_ENGINE_URL}/analyze/dataset/deepfake`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('📡 Dataset analysis response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Dataset analysis error response:', errorText);
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Dataset analysis completed:', result);

    return result;
  } catch (error) {
    console.error('❌ Dataset analysis failed:', error);
    throw error;
  }
}
/**
 * Detect SMS scams using AI Engine
 * Stores results in Supabase for user
 */
export async function detectSMSScam(
  userId: string,
  text: string
): Promise<AIEngineResponse> {
  try {
    console.log('📱 Calling AI Engine SMS detection for:', text.substring(0, 50) + '...');
    
    const response = await fetch(`${AI_ENGINE_URL}/predict/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    console.log('📡 SMS detection response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Engine error response:', errorText);
      throw new Error(`AI Engine unavailable (${response.status})`);
    }

    const result: AIEngineResponse = await response.json();
    console.log('✅ SMS detection result:', result);

    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: text,
      content_type: 'sms',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'scam',
    });

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
    console.error('❌ SMS detection failed:', error);
    throw error;
  }
}

/**
 * Create advanced incident from threat detection
 */
async function createAdvancedIncidentFromThreat(
  userId: string,
  result: AdvancedThreatResponse | DeepfakeAnalysisResponse,
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

    // Generate advanced mitigation steps
    const mitigationSteps = generateAdvancedMitigationSteps(type, result);

    // Create incident with enhanced details
    await supabase.from('incident_reports').insert({
      threat_log_id: threatLog.id,
      title: `${result.classification.toUpperCase()} - Advanced ${type.toUpperCase()} Threat`,
      description: `${result.explanation.join('. ')}${result.threats_detected ? '. Threats: ' + result.threats_detected.join(', ') : ''}`,
      severity: result.risk_level.toLowerCase(),
      status: 'open',
      affected_user_id: userId,
      mitigation_steps: mitigationSteps,
      metadata: {
        threats_detected: result.threats_detected,
        recommendations: result.recommendations,
        advanced_analysis: true
      }
    });
  } catch (error) {
    console.error('Failed to create advanced incident:', error);
  }
}

/**
 * Generate advanced mitigation steps
 */
function generateAdvancedMitigationSteps(
  type: string, 
  result: AdvancedThreatResponse | DeepfakeAnalysisResponse
): string[] {
  const baseSteps = [
    'Document all evidence and advanced analysis results',
    'Monitor affected systems with enhanced detection',
    'Update threat intelligence feeds',
    'Review and update security policies'
  ];

  const typeSpecificSteps: Record<string, string[]> = {
    advanced_url: [
      'Block malicious domain and all subdomains',
      'Check for typosquatting variants',
      'Update DNS filtering rules',
      'Notify threat intelligence community',
      'Conduct user awareness training on typosquatting',
      'Review similar domain registrations'
    ],
    deepfake: [
      'Quarantine suspicious image/content',
      'Analyze for additional deepfake indicators',
      'Update image recognition filters',
      'Train staff on deepfake identification',
      'Review content moderation policies',
      'Report to relevant authorities if malicious'
    ]
  };

  const steps = typeSpecificSteps[type] || [];
  
  // Add threat-specific recommendations
  if ('recommendations' in result && result.recommendations) {
    steps.push(...result.recommendations.map(rec => `AI Recommendation: ${rec}`));
  }
  
  if (result.risk_score > 80) {
    steps.unshift('🚨 CRITICAL: Immediate containment required');
    steps.push('🚨 Escalate to security team immediately');
  }

  return [...steps, ...baseSteps];
}

/**
 * Create incident from threat detection
 */
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

/**
 * Generate mitigation steps based on threat type
 */
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

/**
 * Get user's threat history from Supabase
 */
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

/**
 * Get user's analysis history from Supabase
 */
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

/**
 * Get user's incidents from Supabase
 */
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

/**
 * Subscribe to real-time threat updates for user
 */
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

/**
 * Subscribe to real-time incident updates for user
 */
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

/**
 * Detect email phishing using AI Engine
 * Analyzes email subject and body for phishing indicators
 */
export async function detectEmailPhishing(
  userId: string,
  subject: string,
  body: string
): Promise<EmailPhishingResponse> {
  try {
    console.log('📧 Calling AI Engine email phishing detection');
    console.log('Subject:', subject.substring(0, 50) + '...');
    
    const response = await fetch(`${AI_ENGINE_URL}/detect-email-phishing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    });

    console.log('📡 Email phishing detection response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Engine error response:', errorText);
      throw new Error(`AI Engine unavailable (${response.status})`);
    }

    const result: EmailPhishingResponse = await response.json();
    console.log('✅ Email phishing detection result:', result);

    // Store in Supabase
    await supabase.from('phishing_analysis').insert({
      user_id: userId,
      content: `Subject: ${subject}\n\n${body}`,
      content_type: 'email',
      risk_score: result.risk_score,
      risk_level: result.risk_level.toLowerCase(),
      detected_indicators: result.explanation,
      is_scam: result.classification === 'Phishing Email',
      analysis_details: {
        keywords_detected: result.keywords_detected,
        links_found: result.links_found,
        links: result.links,
        recommended_action: result.recommended_action
      }
    });

    // Create threat log for high-risk emails
    if (result.risk_score > 50) {
      await supabase.from('threat_logs').insert({
        user_id: userId,
        threat_type: 'email_phishing',
        severity: result.risk_level.toLowerCase(),
        source_ip: 'user_submitted',
        description: `Email phishing detected: ${subject}`,
        risk_score: result.risk_score,
        indicators: result.explanation,
        status: 'active',
        metadata: {
          keywords: result.keywords_detected,
          links: result.links
        }
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Email phishing detection failed:', error);
    throw error;
  }
}

/**
 * Analyze audio for AI-generated voice detection
 * Detects deepfake voices using audio feature analysis
 */
export async function analyzeVoiceDeepfake(
  audioFile: File
): Promise<{
  risk_score: number;
  classification: string;
  confidence: string;
  features_detected: string[];
  explanation: string[];
  recommended_action: string;
  audio_duration: number;
  sample_rate: number;
  filename: string;
  file_size_mb: number;
}> {
  try {
    console.log('🎙️ Calling AI Engine voice deepfake detection');
    console.log('File:', audioFile.name, 'Size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
    
    const formData = new FormData();
    formData.append('file', audioFile);
    
    const response = await fetch(`${AI_ENGINE_URL}/analyze-voice`, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Voice analysis response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Engine error response:', errorText);
      throw new Error(`AI Engine unavailable (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ Voice deepfake detection result:', result);

    return result;
  } catch (error) {
    console.error('❌ Voice deepfake detection failed:', error);
    throw error;
  }
}
