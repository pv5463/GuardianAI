export interface ScamAnalysisResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  redFlags: string[];
  explanation: string;
  recommendations: string[];
  detectedIndicators: string[];
}

const urgencyPhrases = [
  'immediately', 'within 24 hours', 'within 2 hours', 'within minutes',
  'expires today', 'expires soon', 'last chance', 'act fast', 'act now',
  'limited time', 'urgent action required', 'time sensitive', 'hurry',
  'right now', 'before midnight', 'today only', 'final notice'
];

const authorityImpersonation = [
  'rbi', 'reserve bank', 'sbi', 'hdfc', 'icici', 'axis bank', 'pnb',
  'state bank', 'police', 'cyber crime', 'income tax', 'gst department',
  'aadhaar', 'uidai', 'government', 'ministry', 'officer', 'inspector',
  'legal department', 'court', 'magistrate', 'customs', 'enforcement',
  'cbi', 'irs', 'tax department', 'revenue department', 'paytm official',
  'phonepe official', 'google pay official', 'amazon official'
];

const financialRequests = [
  'transfer money', 'send money', 'pay now', 'payment required',
  'processing fee', 'registration fee', 'verification fee', 'deposit',
  'advance payment', 'upfront payment', 'wire transfer', 'bank transfer',
  'upi payment', 'collect request', 'approve payment', 'share upi pin',
  'update payment method', 'verify payment', 'confirm payment'
];

const otpRequests = [
  'otp', 'one time password', 'verification code', 'security code',
  'confirm code', 'authentication code', 'share otp', 'send otp',
  'provide otp', 'enter otp', '6 digit code', 'sms code'
];

const accountThreats = [
  'account freeze', 'account blocked', 'account suspended', 'account closed',
  'account deactivated', 'account locked', 'will be blocked', 'will be suspended',
  'legal action', 'arrest warrant', 'police complaint', 'court case',
  'penalty', 'fine', 'charges will apply', 'legal consequences'
];

const fakeJobIndicators = [
  'work from home', 'earn money online', 'part time job', 'registration fee',
  'training fee', 'deposit required', 'refundable deposit', 'guaranteed income',
  'easy money', 'no experience required', 'join now pay later'
];

const emotionalManipulation = [
  'family emergency', 'loved one', 'accident', 'hospital', 'urgent help',
  'medical emergency', 'stranded', 'kidnapped', 'in trouble', 'need help'
];

const secrecyPressure = [
  'do not disconnect', 'stay on line', 'do not hang up', 'keep this confidential',
  'do not tell anyone', 'secret', 'confidential matter', 'private information',
  'do not share with family', 'between us only'
];

const sensitiveInfoRequests = [
  /\b(password|pin|cvv|card number|expiry|atm pin)\b/i,
  /\b(aadhaar|pan card|passport|driving license)\b/i,
  /\b(bank account|account number|ifsc|routing number)\b/i,
  /\b(credit card|debit card|card details)\b/i
];

export function analyzeText(text: string): ScamAnalysisResult {
  const lowerText = text.toLowerCase();
  let score = 0;
  const redFlags: string[] = [];
  const detectedIndicators: string[] = [];
  let criticalIndicatorCount = 0;

  let hasUrgency = false;
  let hasAuthority = false;
  let hasFinancialRequest = false;
  let hasOTPRequest = false;
  let hasAccountThreat = false;
  let hasSensitiveInfoRequest = false;

  urgencyPhrases.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      score += 15;
      redFlags.push(`Urgency pressure: "${phrase}"`);
      detectedIndicators.push('Urgency Tactics');
      hasUrgency = true;
      criticalIndicatorCount++;
    }
  });

  authorityImpersonation.forEach(authority => {
    if (lowerText.includes(authority.toLowerCase())) {
      score += 20;
      redFlags.push(`Authority impersonation: "${authority}"`);
      detectedIndicators.push('Authority Impersonation');
      hasAuthority = true;
      criticalIndicatorCount++;
    }
  });

  financialRequests.forEach(request => {
    if (lowerText.includes(request.toLowerCase())) {
      score += 25;
      redFlags.push(`Financial request: "${request}"`);
      detectedIndicators.push('Financial Request');
      hasFinancialRequest = true;
      criticalIndicatorCount++;
    }
  });

  otpRequests.forEach(otp => {
    if (lowerText.includes(otp.toLowerCase())) {
      score += 30;
      redFlags.push(`OTP/Security code request: "${otp}"`);
      detectedIndicators.push('OTP Request');
      hasOTPRequest = true;
      criticalIndicatorCount++;
    }
  });

  accountThreats.forEach(threat => {
    if (lowerText.includes(threat.toLowerCase())) {
      score += 25;
      redFlags.push(`Account threat: "${threat}"`);
      detectedIndicators.push('Account Freeze/Legal Threat');
      hasAccountThreat = true;
      criticalIndicatorCount++;
    }
  });

  fakeJobIndicators.forEach(indicator => {
    if (lowerText.includes(indicator.toLowerCase())) {
      score += 20;
      redFlags.push(`Fake job indicator: "${indicator}"`);
      detectedIndicators.push('Fake Job Offer');
      criticalIndicatorCount++;
    }
  });

  emotionalManipulation.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      score += 18;
      redFlags.push(`Emotional manipulation: "${phrase}"`);
      detectedIndicators.push('Emotional Manipulation');
      criticalIndicatorCount++;
    }
  });

  secrecyPressure.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      score += 20;
      redFlags.push(`Secrecy pressure: "${phrase}"`);
      detectedIndicators.push('Secrecy Pressure');
      criticalIndicatorCount++;
    }
  });

  sensitiveInfoRequests.forEach(pattern => {
    if (pattern.test(text)) {
      score += 25;
      redFlags.push('Requests sensitive information (passwords, PINs, card details)');
      detectedIndicators.push('Sensitive Info Request');
      hasSensitiveInfoRequest = true;
      criticalIndicatorCount++;
    }
  });

  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 0) {
    score += linkCount * 10;
    redFlags.push(`Contains ${linkCount} link(s) - potential phishing`);
  }

  if (lowerText.includes('click here') || lowerText.includes('click link')) {
    score += 15;
    redFlags.push('Suspicious call-to-action: "click here/link"');
  }

  if ((hasFinancialRequest || hasOTPRequest) && hasUrgency) {
    score += 20;
    redFlags.push('🚨 CRITICAL: Financial/OTP request combined with urgency');
    criticalIndicatorCount++;
  }

  if (hasAuthority && (hasFinancialRequest || hasOTPRequest)) {
    score += 25;
    redFlags.push('🚨 CRITICAL: Authority impersonation with financial/OTP request');
    criticalIndicatorCount++;
  }

  if (hasAccountThreat && hasUrgency) {
    score += 20;
    redFlags.push('🚨 CRITICAL: Account threat with urgency pressure');
    criticalIndicatorCount++;
  }

  if (criticalIndicatorCount >= 3) {
    score = Math.max(score, 75);
  }

  if ((hasFinancialRequest || hasOTPRequest) && (hasAuthority || hasAccountThreat)) {
    score = Math.max(score, 80);
  }

  score = Math.min(score, 100);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (score < 30) riskLevel = 'low';
  else if (score < 60) riskLevel = 'medium';
  else if (score < 85) riskLevel = 'high';
  else riskLevel = 'critical';

  const explanation = generateExplanation(score, riskLevel, redFlags, criticalIndicatorCount);
  const recommendations = generateRecommendations(riskLevel, hasOTPRequest, hasFinancialRequest, hasAuthority);

  return { 
    score, 
    riskLevel, 
    redFlags: [...new Set(redFlags)], 
    explanation, 
    recommendations,
    detectedIndicators: [...new Set(detectedIndicators)]
  };
}

function generateExplanation(score: number, riskLevel: string, redFlags: string[], criticalCount: number): string {
  if (riskLevel === 'critical') {
    return `🚨 CRITICAL THREAT DETECTED: This message exhibits severe scam characteristics with ${redFlags.length} major red flags and ${criticalCount} critical indicators. This is almost certainly a scam attempt. DO NOT INTERACT with this message, do not click any links, and do not provide any information.`;
  } else if (riskLevel === 'high') {
    return `⚠️ HIGH RISK SCAM: This message shows strong scam patterns with ${redFlags.length} red flags detected. Multiple critical indicators present including potential authority impersonation, financial requests, or urgency tactics. Treat this as a scam attempt.`;
  } else if (riskLevel === 'medium') {
    return `⚠️ SUSPICIOUS MESSAGE: This message contains ${redFlags.length} concerning patterns. While not definitively a scam, it exhibits characteristics commonly used in fraud attempts. Exercise extreme caution and verify through official channels.`;
  } else {
    return `✓ LOW RISK: This message shows minimal scam indicators. However, always remain vigilant with unsolicited messages and verify sender identity through official channels before taking any action.`;
  }
}

function generateRecommendations(riskLevel: string, hasOTP: boolean, hasFinancial: boolean, hasAuthority: boolean): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('🚨 DO NOT respond to this message');
    recommendations.push('🚨 DO NOT click any links in the message');
    recommendations.push('🚨 DO NOT share OTP, passwords, PINs, or financial information');
    recommendations.push('🚨 Block the sender immediately');
    recommendations.push('🚨 Report to cybercrime.gov.in');
    recommendations.push('🚨 Delete the message');
    
    if (hasOTP) {
      recommendations.push('⚠️ NEVER share OTP with anyone - banks/government never ask for OTP');
    }
    
    if (hasFinancial) {
      recommendations.push('⚠️ No legitimate organization asks for immediate payment via SMS/call');
      recommendations.push('⚠️ Monitor your bank accounts for suspicious activity');
    }
    
    if (hasAuthority) {
      recommendations.push('⚠️ Verify by calling official number from organization website (not from message)');
      recommendations.push('⚠️ Government/banks never threaten via SMS or unsolicited calls');
    }
    
    recommendations.push('📞 If you shared information, contact your bank immediately');
    recommendations.push('📞 Change passwords if you clicked any links');
  } else if (riskLevel === 'medium') {
    recommendations.push('⚠️ Do not respond without verification');
    recommendations.push('⚠️ Do not click links - visit official website directly');
    recommendations.push('⚠️ Verify sender through official channels');
    recommendations.push('⚠️ Do not share personal or financial information');
    recommendations.push('📞 Contact organization using official contact details');
  } else {
    recommendations.push('✓ Verify sender identity if unsure');
    recommendations.push('✓ Use official channels for sensitive transactions');
    recommendations.push('✓ Never share OTP or passwords');
  }

  return recommendations;
}

export function analyzeURL(url: string): ScamAnalysisResult {
  let score = 0;
  const redFlags: string[] = [];
  const detectedIndicators: string[] = [];
  let criticalIndicatorCount = 0;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      score += 35;
      redFlags.push('🚨 Uses IP address instead of domain name - major red flag');
      detectedIndicators.push('IP Address Used');
      criticalIndicatorCount++;
    }
    
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.info', '.biz', '.club', '.online', '.site'];
    if (suspiciousTLDs.some(tld => hostname.endsWith(tld))) {
      score += 30;
      redFlags.push(`Suspicious top-level domain (${hostname.split('.').pop()}) - commonly used in scams`);
      detectedIndicators.push('Suspicious TLD');
      criticalIndicatorCount++;
    }
    
    const subdomainCount = hostname.split('.').length - 2;
    if (subdomainCount > 2) {
      score += 25;
      redFlags.push(`Excessive subdomains (${subdomainCount}) - subdomain manipulation detected`);
      detectedIndicators.push('Subdomain Manipulation');
      criticalIndicatorCount++;
    }
    
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly'];
    if (shorteners.some(s => hostname.includes(s))) {
      score += 20;
      redFlags.push('URL shortener detected - hides true destination');
      detectedIndicators.push('URL Shortener');
    }
    
    const trustedBrands = [
      { name: 'sbi', official: ['onlinesbi.sbi', 'sbi.co.in', 'onlinesbi.com'] },
      { name: 'hdfc', official: ['hdfcbank.com', 'hdfcbank.co.in'] },
      { name: 'icici', official: ['icicibank.com', 'icicibank.co.in'] },
      { name: 'axis', official: ['axisbank.com', 'axisbank.co.in'] },
      { name: 'paytm', official: ['paytm.com', 'paytm.in'] },
      { name: 'phonepe', official: ['phonepe.com', 'phonepe.in'] },
      { name: 'googlepay', official: ['pay.google.com'] },
      { name: 'amazon', official: ['amazon.in', 'amazon.com'] },
      { name: 'flipkart', official: ['flipkart.com'] },
      { name: 'aadhaar', official: ['uidai.gov.in'] },
      { name: 'government', official: ['.gov.in', '.nic.in'] }
    ];

    trustedBrands.forEach(brand => {
      if (hostname.includes(brand.name)) {
        const isOfficial = brand.official.some(domain => hostname.endsWith(domain));
        if (!isOfficial) {
          score += 40;
          redFlags.push(`🚨 BRAND IMPERSONATION: Domain contains "${brand.name}" but is NOT official domain`);
          detectedIndicators.push('Brand Impersonation');
          criticalIndicatorCount++;
        }
      }
    });

    const typosquatPatterns = [
      { original: 'sbi', typos: ['sbl', 'sb1', 'sbi-', 'sbii', 'sbibank', 'sbi-verify', 'sbi-secure'] },
      { original: 'hdfc', typos: ['hdfc-', 'hdfcbank-', 'hdfc1', 'hdfcc'] },
      { original: 'paytm', typos: ['paytm-', 'paytm1', 'paytmm', 'pay-tm'] },
      { original: 'amazon', typos: ['amaz0n', 'amazom', 'amazon-'] },
      { original: 'google', typos: ['g00gle', 'gooogle', 'googl'] }
    ];

    typosquatPatterns.forEach(pattern => {
      pattern.typos.forEach(typo => {
        if (hostname.includes(typo)) {
          score += 35;
          redFlags.push(`🚨 TYPOSQUATTING: Domain mimics "${pattern.original}" - deliberate impersonation`);
          detectedIndicators.push('Typosquatting');
          criticalIndicatorCount++;
        }
      });
    });

    const suspiciousKeywords = ['verify', 'secure', 'login', 'account', 'update', 'confirm', 'banking', 'wallet', 'payment'];
    suspiciousKeywords.forEach(keyword => {
      if (hostname.includes(keyword)) {
        score += 15;
        redFlags.push(`Suspicious keyword in domain: "${keyword}"`);
      }
    });
    
    if (urlObj.protocol !== 'https:') {
      score += 25;
      redFlags.push('⚠️ Not using secure HTTPS protocol - data not encrypted');
      detectedIndicators.push('No HTTPS');
      criticalIndicatorCount++;
    }

    if (hostname.includes('-') && hostname.split('-').length > 2) {
      score += 15;
      redFlags.push('Multiple hyphens in domain - suspicious pattern');
    }

    if (criticalIndicatorCount >= 2) {
      score = Math.max(score, 75);
    }
    
    score = Math.min(score, 100);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score < 30) riskLevel = 'low';
    else if (score < 60) riskLevel = 'medium';
    else if (score < 85) riskLevel = 'high';
    else riskLevel = 'critical';
    
    return {
      score,
      riskLevel,
      redFlags,
      explanation: generateURLExplanation(riskLevel, redFlags.length, hostname),
      recommendations: generateURLRecommendations(riskLevel, criticalIndicatorCount),
      detectedIndicators: [...new Set(detectedIndicators)]
    };
  } catch (error) {
    return {
      score: 60,
      riskLevel: 'medium',
      redFlags: ['Invalid or malformed URL format'],
      explanation: '⚠️ Unable to parse URL properly. This could indicate a malformed or suspicious link. Do not visit.',
      recommendations: [
        '⚠️ Do not click this link',
        '⚠️ Verify the correct URL from official sources',
        '⚠️ Report if received in suspicious message'
      ],
      detectedIndicators: ['Invalid URL']
    };
  }
}

function generateURLExplanation(riskLevel: string, flagCount: number, hostname: string): string {
  if (riskLevel === 'critical') {
    return `🚨 CRITICAL: This URL is extremely dangerous with ${flagCount} major red flags. Domain "${hostname}" shows clear signs of impersonation or malicious intent. DO NOT VISIT THIS LINK.`;
  } else if (riskLevel === 'high') {
    return `⚠️ HIGH RISK: This URL exhibits ${flagCount} suspicious characteristics. Domain "${hostname}" likely designed to deceive users. Treat as phishing attempt.`;
  } else if (riskLevel === 'medium') {
    return `⚠️ SUSPICIOUS: URL shows ${flagCount} concerning patterns. Domain "${hostname}" requires verification before visiting.`;
  } else {
    return `✓ URL appears relatively safe with minimal red flags. However, always verify legitimacy before entering sensitive information.`;
  }
}

function generateURLRecommendations(riskLevel: string, criticalCount: number): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('🚨 DO NOT visit this URL');
    recommendations.push('🚨 DO NOT enter any personal information');
    recommendations.push('🚨 Block sender if received via message');
    recommendations.push('🚨 Report to cybercrime.gov.in');
    recommendations.push('⚠️ Visit official website by typing URL directly in browser');
    recommendations.push('⚠️ Check official domain from organization website');
    recommendations.push('⚠️ Look for HTTPS and padlock icon (but these can be faked)');
    
    if (criticalCount >= 2) {
      recommendations.push('🚨 This URL shows multiple critical indicators - definitely avoid');
    }
  } else if (riskLevel === 'medium') {
    recommendations.push('⚠️ Verify URL authenticity before visiting');
    recommendations.push('⚠️ Do not enter sensitive information');
    recommendations.push('⚠️ Check official website for correct domain');
    recommendations.push('⚠️ Use antivirus/security software');
  } else {
    recommendations.push('✓ Verify URL matches official domain');
    recommendations.push('✓ Check for HTTPS before entering information');
    recommendations.push('✓ Be cautious with login credentials');
  }

  return recommendations;
}
export function analyzeUPI(upiId: string): ScamAnalysisResult {
  let score = 0;
  const redFlags: string[] = [];
  const detectedIndicators: string[] = [];
  let criticalIndicatorCount = 0;
  
  const upiPattern = /^[\w.-]+@[\w.-]+$/;
  if (!upiPattern.test(upiId)) {
    score += 45;
    redFlags.push('🚨 Invalid UPI ID format - likely fake or malicious');
    detectedIndicators.push('Invalid Format');
    criticalIndicatorCount++;
  }
  
  if (/\d{10,}/.test(upiId)) {
    score += 25;
    redFlags.push('Contains unusually long number sequence - suspicious pattern');
    detectedIndicators.push('Suspicious Number Pattern');
    criticalIndicatorCount++;
  }

  const officialHandles = ['paytm', 'phonepe', 'gpay', 'ybl', 'okaxis', 'okhdfcbank', 'okicici', 'oksbi'];
  const suspiciousHandles = officialHandles.filter(handle => {
    const lowerUPI = upiId.toLowerCase();
    return lowerUPI.includes(handle) && !lowerUPI.endsWith(`@${handle}`);
  });
  
  if (suspiciousHandles.length > 0) {
    score += 35;
    redFlags.push(`🚨 Fake UPI handle detected - mimics official "${suspiciousHandles[0]}" but is not genuine`);
    detectedIndicators.push('Fake UPI Handle');
    criticalIndicatorCount++;
  }

  const scamKeywords = ['verify', 'confirm', 'update', 'secure', 'official', 'support', 'refund', 'cashback'];
  scamKeywords.forEach(keyword => {
    if (upiId.toLowerCase().includes(keyword)) {
      score += 20;
      redFlags.push(`Suspicious keyword in UPI ID: "${keyword}"`);
      detectedIndicators.push('Suspicious Keywords');
    }
  });

  if (upiId.includes('..') || upiId.includes('--')) {
    score += 15;
    redFlags.push('Unusual character patterns in UPI ID');
  }

  const parts = upiId.split('@');
  if (parts.length === 2 && parts[0].length < 3) {
    score += 20;
    redFlags.push('Suspiciously short UPI username');
  }

  if (criticalIndicatorCount >= 2) {
    score = Math.max(score, 75);
  }
  
  score = Math.min(score, 100);
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (score < 30) riskLevel = 'low';
  else if (score < 60) riskLevel = 'medium';
  else if (score < 85) riskLevel = 'high';
  else riskLevel = 'critical';
  
  return {
    score,
    riskLevel,
    redFlags,
    explanation: generateUPIExplanation(riskLevel, redFlags.length, upiId),
    recommendations: generateUPIRecommendations(riskLevel),
    detectedIndicators: [...new Set(detectedIndicators)]
  };
}

function generateUPIExplanation(riskLevel: string, flagCount: number, upiId: string): string {
  if (riskLevel === 'critical') {
    return `🚨 CRITICAL: This UPI ID "${upiId}" is extremely suspicious with ${flagCount} major red flags. DO NOT send money to this UPI ID.`;
  } else if (riskLevel === 'high') {
    return `⚠️ HIGH RISK: UPI ID "${upiId}" shows ${flagCount} suspicious characteristics. Likely a scam account.`;
  } else if (riskLevel === 'medium') {
    return `⚠️ SUSPICIOUS: UPI ID shows ${flagCount} concerning patterns. Verify recipient identity before sending money.`;
  } else {
    return `✓ UPI ID appears valid. However, always verify recipient identity before sending money.`;
  }
}

function generateUPIRecommendations(riskLevel: string): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('🚨 DO NOT send money to this UPI ID');
    recommendations.push('🚨 Block and report this UPI ID');
    recommendations.push('🚨 Report to your bank and cybercrime.gov.in');
    recommendations.push('⚠️ Verify recipient through alternate channel (phone call)');
    recommendations.push('⚠️ Check if UPI ID matches known contact');
    recommendations.push('⚠️ Never send money based on SMS/WhatsApp requests alone');
    recommendations.push('📞 If you sent money, contact bank immediately for reversal');
  } else if (riskLevel === 'medium') {
    recommendations.push('⚠️ Verify recipient identity before sending money');
    recommendations.push('⚠️ Double-check UPI ID with recipient via call');
    recommendations.push('⚠️ Start with small test amount if unsure');
    recommendations.push('⚠️ Never send money to unknown UPI IDs');
  } else {
    recommendations.push('✓ Verify recipient identity before sending money');
    recommendations.push('✓ Double-check UPI ID spelling');
    recommendations.push('✓ Keep transaction records');
    recommendations.push('✓ Report suspicious UPI IDs to your bank');
  }

  return recommendations;
}
