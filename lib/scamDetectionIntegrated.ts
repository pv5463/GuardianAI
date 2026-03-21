/**
 * Integrated Scam Detection - Uses AI Engine with local fallback
 * Automatically stores results in Supabase for user-specific tracking
 */

import { detectSMSScam, detectPhishingURL, detectAdvancedPhishingURL, checkAIEngineHealth, detectEmailPhishing } from './aiEngineClient';

export interface ScamAnalysisResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  redFlags: string[];
  explanation: string;
  recommendations: string[];
  detectedIndicators: string[];
  aiEngineUsed?: boolean;
}

/**
 * Analyze text for scams using AI Engine (with fallback)
 * Automatically stores results in Supabase if userId provided
 * Detects if input is an email and uses appropriate analysis
 */
export async function analyzeText(text: string, userId?: string): Promise<ScamAnalysisResult> {
  console.log('🔍 Analyzing text:', text.substring(0, 50) + '...');
  console.log('👤 User ID:', userId);
  
  // Check if text looks like an email (has Subject: or From:)
  const isEmail = /^(subject|from):/im.test(text.trim());
  
  if (isEmail && userId) {
    // Parse email format
    const subjectMatch = text.match(/^subject:\s*(.+?)$/im);
    const bodyMatch = text.split(/\n\n/);
    
    const subject = subjectMatch ? subjectMatch[1].trim() : '';
    const body = bodyMatch.length > 1 ? bodyMatch.slice(1).join('\n\n') : text;
    
    try {
      console.log('📧 Detected email format, using email phishing detection');
      const isHealthy = await checkAIEngineHealth();
      
      if (isHealthy) {
        const aiResult = await detectEmailPhishing(userId, subject, body);
        console.log('✅ Email phishing detection result:', aiResult);
        
        return {
          score: aiResult.risk_score,
          riskLevel: aiResult.risk_level.toLowerCase() as any,
          redFlags: aiResult.explanation,
          explanation: aiResult.explanation.join('. '),
          recommendations: [aiResult.recommended_action],
          detectedIndicators: aiResult.keywords_detected,
          aiEngineUsed: true,
        };
      }
    } catch (error) {
      console.error('❌ Email phishing detection failed, falling back:', error);
    }
  }
  
  if (userId) {
    try {
      console.log('🔌 Checking AI Engine health...');
      const isHealthy = await checkAIEngineHealth();
      console.log('💚 AI Engine healthy:', isHealthy);
      
      if (isHealthy) {
        console.log('🚀 Calling AI Engine for SMS analysis...');
        const aiResult = await detectSMSScam(userId, text);
        console.log('✅ AI Engine response:', aiResult);
        
        return {
          score: aiResult.risk_score,
          riskLevel: aiResult.risk_level.toLowerCase() as any,
          redFlags: aiResult.explanation,
          explanation: aiResult.explanation.join('. '),
          recommendations: generateRecommendations(aiResult.risk_score),
          detectedIndicators: aiResult.explanation,
          aiEngineUsed: true,
        };
      } else {
        console.log('⚠️ AI Engine not healthy, using local analysis');
      }
    } catch (error) {
      console.error('❌ AI Engine error, falling back to local analysis:', error);
    }
  } else {
    console.log('⚠️ No user ID provided, using local analysis');
  }

  console.log('🔄 Falling back to local analysis');
  return analyzeTextLocal(text);
}

/**
 * Analyze URL for phishing using AI Engine (with fallback)
 * Automatically stores results in Supabase if userId provided
 */
export async function analyzeURL(url: string, userId?: string): Promise<ScamAnalysisResult> {
  console.log('🔍 Analyzing URL:', url);
  console.log('👤 User ID:', userId);
  
  if (userId) {
    try {
      console.log('🔌 Checking AI Engine health...');
      const isHealthy = await checkAIEngineHealth();
      console.log('💚 AI Engine healthy:', isHealthy);
      
      if (isHealthy) {
        console.log('🚀 Calling Advanced AI Engine for URL analysis...');
        const aiResult = await detectAdvancedPhishingURL(userId, url, true);
        console.log('✅ Advanced AI Engine response:', aiResult);
        
        return {
          score: aiResult.risk_score,
          riskLevel: aiResult.risk_level.toLowerCase() as any,
          redFlags: aiResult.explanation,
          explanation: aiResult.explanation.join('. '),
          recommendations: aiResult.recommendations || generateRecommendations(aiResult.risk_score),
          detectedIndicators: aiResult.threats_detected || aiResult.explanation,
          aiEngineUsed: true,
        };
      } else {
        console.log('⚠️ AI Engine not healthy, using local analysis');
      }
    } catch (error) {
      console.error('❌ Advanced AI Engine error, falling back to basic AI Engine:', error);
      
      // Fallback to basic AI Engine
      try {
        const basicResult = await detectPhishingURL(userId, url);
        console.log('✅ Basic AI Engine response:', basicResult);
        
        return {
          score: basicResult.risk_score,
          riskLevel: basicResult.risk_level.toLowerCase() as any,
          redFlags: basicResult.explanation,
          explanation: basicResult.explanation.join('. '),
          recommendations: generateRecommendations(basicResult.risk_score),
          detectedIndicators: basicResult.explanation,
          aiEngineUsed: true,
        };
      } catch (basicError) {
        console.error('❌ Basic AI Engine also failed, using local analysis:', basicError);
      }
    }
  } else {
    console.log('⚠️ No user ID provided, using local analysis');
  }

  console.log('🔄 Using local analysis');
  return analyzeURLLocal(url);
}

/**
 * Advanced URL analysis with enhanced typosquatting detection
 */
export async function analyzeURLAdvanced(url: string, userId?: string): Promise<ScamAnalysisResult & {
  typosquattingInfo?: {
    similarTo: string;
    similarityScore: number;
    warning: string;
  };
  threatsDetected?: string[];
  reputationCheck?: any;
}> {
  console.log('🔍 Advanced URL Analysis:', url);
  
  if (!userId) {
    // Return enhanced local analysis
    const localResult = analyzeURLLocal(url);
    return {
      ...localResult,
      typosquattingInfo: checkLocalTyposquatting(url),
    };
  }

  try {
    const isHealthy = await checkAIEngineHealth();
    
    if (isHealthy) {
      console.log('🚀 Using Advanced AI Engine...');
      const aiResult = await detectAdvancedPhishingURL(userId, url, true);
      
      return {
        score: aiResult.risk_score,
        riskLevel: aiResult.risk_level.toLowerCase() as any,
        redFlags: aiResult.explanation,
        explanation: aiResult.explanation.join('. '),
        recommendations: aiResult.recommendations || generateRecommendations(aiResult.risk_score),
        detectedIndicators: aiResult.threats_detected || aiResult.explanation,
        aiEngineUsed: true,
        typosquattingInfo: aiResult.details?.typosquatting ? {
          similarTo: aiResult.details.typosquatting.similar_to,
          similarityScore: aiResult.details.typosquatting.similarity_score,
          warning: aiResult.details.typosquatting.warning
        } : undefined,
        threatsDetected: aiResult.threats_detected,
        reputationCheck: aiResult.details?.reputation
      };
    }
  } catch (error) {
    console.error('❌ Advanced analysis failed:', error);
  }

  // Fallback to enhanced local analysis
  const localResult = analyzeURLLocal(url);
  return {
    ...localResult,
    typosquattingInfo: checkLocalTyposquatting(url),
  };
}

// Local analysis functions (fallback)
function analyzeTextLocal(text: string): ScamAnalysisResult {
  const lowerText = text.toLowerCase();
  let score = 0;
  const redFlags: string[] = [];
  const detectedIndicators: string[] = [];
  const matchedWords = new Set<string>(); // Track unique matches

  // Check for legitimacy indicators FIRST (negative signals)
  const legitimacyPhrases = [
    'never ask', 'never share', 'official', 'reminder', 'committed',
    'thank you', 'visit our', 'contact us', 'customer support',
    'nearest branch', 'official website', 'official app', 'helpline',
    'stay safe', 'report suspicious', 'we never', 'do not share'
  ];
  
  let legitimacyScore = 0;
  legitimacyPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      legitimacyScore += 15;
    }
  });
  
  // If high legitimacy score, reduce overall risk significantly
  if (legitimacyScore > 20) {
    return {
      score: 0,
      riskLevel: 'low',
      redFlags: ['Legitimate security reminder detected'],
      explanation: 'Message appears to be a legitimate security advisory',
      recommendations: ['This appears to be a genuine security reminder', 'Always verify through official channels'],
      detectedIndicators: ['legitimate_advisory'],
      aiEngineUsed: false,
    };
  }

  // Check for requests to share sensitive information (HIGH RISK)
  const sensitiveRequests = /(enter|share|provide|send|click here).*(pin|otp|password|cvv|card number|atm)/i;
  if (sensitiveRequests.test(text)) {
    score += 40;
    redFlags.push('🚨 Requests sensitive information (PIN/OTP/Password)');
    detectedIndicators.push('sensitive_info_request');
  }

  // Urgency detection (max 20 points)
  const urgencyWords = ['urgent', 'immediately', 'now', 'expire', 'limited', 'hurry', 'quick', 'asap', 'final'];
  let urgencyScore = 0;
  urgencyWords.forEach(word => {
    if (lowerText.includes(word) && !matchedWords.has(word)) {
      urgencyScore += 10;
      redFlags.push(`Urgency pressure: "${word}"`);
      detectedIndicators.push('urgency_tactics');
      matchedWords.add(word);
    }
  });
  score += Math.min(urgencyScore, 20);

  // Threats (25 points)
  const threats = ['blocked', 'suspended', 'closed', 'legal action', 'arrest', 'permanently'];
  let threatScore = 0;
  threats.forEach(word => {
    if (lowerText.includes(word) && !matchedWords.has(word)) {
      threatScore += 12;
      redFlags.push(`Threatening language: "${word}"`);
      detectedIndicators.push('threats');
      matchedWords.add(word);
    }
  });
  score += Math.min(threatScore, 25);

  // Authority impersonation (max 15 points - reduced from 25)
  const authorityWords = ['police', 'government', 'tax', 'officer', 'official', 'department'];
  let authorityScore = 0;
  authorityWords.forEach(word => {
    if (lowerText.includes(word) && !matchedWords.has(word)) {
      authorityScore += 8;
      redFlags.push(`Authority impersonation: "${word}"`);
      detectedIndicators.push('authority_impersonation');
      matchedWords.add(word);
    }
  });
  score += Math.min(authorityScore, 15);

  // Financial requests (max 20 points - reduced from 25)
  const moneyWords = ['prize', 'won', 'cash', 'claim', 'reward', 'lottery', 'inheritance'];
  let moneyScore = 0;
  moneyWords.forEach(word => {
    if (lowerText.includes(word) && !matchedWords.has(word)) {
      moneyScore += 10;
      redFlags.push(`Financial lure: "${word}"`);
      detectedIndicators.push('financial_pressure');
      matchedWords.add(word);
    }
  });
  score += Math.min(moneyScore, 20);

  // Links (15 points)
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
    explanation: redFlags.length > 0 ? redFlags.join('. ') : 'No suspicious patterns detected',
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

function checkLocalTyposquatting(url: string): {
  similarTo: string;
  similarityScore: number;
  warning: string;
} | undefined {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    const trustedDomains = [
      'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
      'apple.com', 'paypal.com', 'netflix.com', 'twitter.com',
      'instagram.com', 'linkedin.com', 'youtube.com', 'github.com'
    ];
    
    for (const trusted of trustedDomains) {
      const similarity = calculateSimilarity(domain, trusted);
      
      // High similarity but not exact match = potential typosquatting
      if (similarity > 0.75 && domain !== trusted) {
        return {
          similarTo: trusted,
          similarityScore: similarity,
          warning: `Domain "${domain}" is highly similar to trusted domain "${trusted}"`
        };
      }
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
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
