/**
 * Integrated Scam Detection - Uses AI Engine with local fallback
 * Automatically stores results in Supabase for user-specific tracking
 */

import { detectSMSScam, detectPhishingURL, checkAIEngineHealth } from './aiEngineClient';

export interface ScamAnalysisResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  redFlags: string[];
  explanation: string;
  recommendations: string[];
  detectedIndicators: string[];
  aiEngineUsed: boolean;
}

/**
 * Analyze text for scams using AI Engine (with fallback)
 * Automatically stores results in Supabase if userId provided
 */
export async function analyzeText(text: string, userId?: string): Promise<ScamAnalysisResult> {
  // Try AI Engine first if user ID provided
  if (userId) {
    try {
      const isHealthy = await checkAIEngineHealth();
      if (isHealthy) {
        const aiResult = await detectSMSScam(userId, text);
        return {
          score: aiResult.risk_score,
          riskLevel: aiResult.risk_level.toLowerCase() as any,
          redFlags: aiResult.explanation,
          explanation: aiResult.explanation.join('. '),
          recommendations: generateRecommendations(aiResult.risk_score),
          detectedIndicators: aiResult.explanation,
          aiEngineUsed: true,
        };
      }
    } catch (error) {
      console.warn('AI Engine unavailable, using local analysis:', error);
    }
  }

  // Fallback to local analysis
  return analyzeTextLocal(text);
}

/**
 * Analyze URL for phishing using AI Engine (with fallback)
 * Automatically stores results in Supabase if userId provided
 */
export async function analyzeURL(url: string, userId?: string): Promise<ScamAnalysisResult> {
  // Try AI Engine first if user ID provided
  if (userId) {
    try {
      const isHealthy = await checkAIEngineHealth();
      if (isHealthy) {
        const aiResult = await detectPhishingURL(userId, url);
        return {
          score: aiResult.risk_score,
          riskLevel: aiResult.risk_level.toLowerCase() as any,
          redFlags: aiResult.explanation,
          explanation: aiResult.explanation.join('. '),
          recommendations: generateRecommendations(aiResult.risk_score),
          detectedIndicators: aiResult.explanation,
          aiEngineUsed: true,
        };
      }
    } catch (error) {
      console.warn('AI Engine unavailable, using local analysis:', error);
    }
  }

  // Fallback to local analysis
  return analyzeURLLocal(url);
}

// Local analysis functions (fallback)
function analyzeTextLocal(text: string): ScamAnalysisResult {
  const lowerText = text.toLowerCase();
  let score = 0;
  const redFlags: string[] = [];
  const detectedIndicators: string[] = [];

  // Urgency detection
  const urgencyWords = ['urgent', 'immediately', 'now', 'expire', 'limited', 'hurry', 'quick', 'asap'];
  urgencyWords.forEach(word => {
    if (lowerText.includes(word)) {
      score += 15;
      redFlags.push(`Urgency pressure: "${word}"`);
      detectedIndicators.push('urgency_tactics');
    }
  });

  // Authority impersonation
  const authorityWords = ['police', 'bank', 'government', 'tax', 'officer', 'official', 'department'];
  authorityWords.forEach(word => {
    if (lowerText.includes(word)) {
      score += 20;
      redFlags.push(`Authority impersonation: "${word}"`);
      detectedIndicators.push('authority_impersonation');
    }
  });

  // Financial requests
  const moneyWords = ['pay', 'money', 'transfer', 'payment', 'deposit', 'fee', 'prize', 'won'];
  moneyWords.forEach(word => {
    if (lowerText.includes(word)) {
      score += 20;
      redFlags.push(`Financial request: "${word}"`);
      detectedIndicators.push('financial_pressure');
    }
  });

  // OTP/Security code requests
  if (lowerText.includes('otp') || lowerText.includes('code') || lowerText.includes('pin')) {
    score += 30;
    redFlags.push('🚨 Requests OTP/security code');
    detectedIndicators.push('otp_request');
  }

  // Links
  if (lowerText.match(/http[s]?:\/\/|www\./)) {
    score += 15;
    redFlags.push('Contains suspicious link');
    detectedIndicators.push('suspicious_link');
  }

  score = Math.min(score, 100);

  return {
    score,
    riskLevel: getRiskLevel(score),
    redFlags,
    explanation: redFlags.join('. '),
    recommendations: generateRecommendations(score),
    detectedIndicators,
    aiEngineUsed: false,
  };
}

function analyzeURLLocal(url: string): ScamAnalysisResult {
  let score = 0;
  const redFlags: string[] = [];
  const detectedIndicators: string[] = [];

  try {
    const urlObj = new URL(url);
    
    // Check HTTPS
    if (urlObj.protocol !== 'https:') {
      score += 25;
      redFlags.push('No HTTPS encryption');
      detectedIndicators.push('no_https');
    }

    // Check suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    if (suspiciousTLDs.some(tld => url.endsWith(tld))) {
      score += 30;
      redFlags.push('Suspicious domain extension');
      detectedIndicators.push('suspicious_tld');
    }

    // Check for IP address
    if (/\d+\.\d+\.\d+\.\d+/.test(urlObj.hostname)) {
      score += 35;
      redFlags.push('IP address instead of domain');
      detectedIndicators.push('ip_address');
    }

    // Check domain length
    if (urlObj.hostname.length > 30) {
      score += 10;
      redFlags.push('Unusually long domain');
      detectedIndicators.push('long_domain');
    }

    // Check for brand keywords
    const brandKeywords = ['paypal', 'amazon', 'microsoft', 'google', 'apple', 'bank'];
    if (brandKeywords.some(brand => urlObj.hostname.includes(brand))) {
      score += 20;
      redFlags.push('Possible brand impersonation');
      detectedIndicators.push('brand_impersonation');
    }

    score = Math.min(score, 100);
  } catch (error) {
    score = 50;
    redFlags.push('Invalid URL format');
  }

  return {
    score,
    riskLevel: getRiskLevel(score),
    redFlags,
    explanation: redFlags.join('. '),
    recommendations: generateRecommendations(score),
    detectedIndicators,
    aiEngineUsed: false,
  };
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  if (score < 85) return 'high';
  return 'critical';
}

function generateRecommendations(score: number): string[] {
  if (score > 75) {
    return [
      '🚨 HIGH RISK: Do not interact with this content',
      '🚨 Block sender/URL immediately',
      '🚨 Report to authorities',
      '🚨 Do not share personal information',
      '🚨 Warn others about this scam',
    ];
  } else if (score > 50) {
    return [
      '⚠️ MEDIUM RISK: Exercise caution',
      '⚠️ Verify sender through official channels',
      '⚠️ Do not click suspicious links',
      '⚠️ Check for spelling/grammar errors',
    ];
  } else {
    return [
      '✓ LOW RISK: Appears legitimate',
      '✓ Still verify sender if unsure',
      '✓ Be cautious with personal information',
    ];
  }
}
