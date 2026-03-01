import { analyzeAudioBuffer, type AudioAnalysisData } from './audioAnalysis';

export interface VoiceAnalysisResult {
  transcript: string;
  scamScore: number;
  deepfakeScore: number;
  detectedFlags: string[];
  suspiciousSentences: Array<{ text: string; reason: string }>;
  tactics: string[];
  recommendations: string[];
  audioData?: AudioAnalysisData;
}

const urgencyKeywords = [
  'immediately', 'urgent', 'right now', 'within minutes', 'within 2 hours',
  'expires today', 'last chance', 'act fast', 'limited time', 'hurry', 'quick',
  'before midnight', 'today only', 'time sensitive'
];

const authorityImpersonation = [
  'police', 'officer', 'government', 'tax department', 'irs', 'fbi', 'cbi',
  'bank manager', 'security team', 'fraud department', 'legal action',
  'court', 'arrest warrant', 'investigation', 'rbi', 'reserve bank',
  'cyber crime', 'income tax', 'customs', 'enforcement'
];

const financialPressure = [
  'pay now', 'send money', 'transfer', 'payment required', 'overdue',
  'penalty', 'fine', 'charges', 'account blocked', 'suspended account',
  'verify payment', 'update payment method', 'processing fee', 'deposit'
];

const otpRequests = [
  'otp', 'one time password', 'verification code', 'security code',
  'confirm code', 'authentication code', 'pin', 'cvv', 'share otp',
  'provide otp', 'send otp', '6 digit code'
];

const emotionalManipulation = [
  'family emergency', 'loved one', 'accident', 'hospital', 'danger',
  'help needed', 'crisis', 'trouble', 'worried', 'scared', 'urgent help',
  'medical emergency', 'stranded', 'kidnapped'
];

const secrecyPressure = [
  'do not disconnect', 'stay on line', 'do not hang up', 'keep this confidential',
  'do not tell anyone', 'secret', 'confidential matter', 'private information',
  'do not share with family', 'between us only', 'keep this private'
];

export function analyzeVoiceTranscript(transcript: string, audioData?: AudioAnalysisData): VoiceAnalysisResult {
  const lowerTranscript = transcript.toLowerCase();
  let scamScore = 0;
  const detectedFlags: string[] = [];
  const suspiciousSentences: Array<{ text: string; reason: string }> = [];
  const tactics: string[] = [];
  let criticalIndicatorCount = 0;

  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let hasUrgency = false;
  let hasAuthority = false;
  let hasFinancial = false;
  let hasOTP = false;
  let hasSecrecy = false;

  urgencyKeywords.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      scamScore += 15;
      detectedFlags.push(`Urgency pressure: "${keyword}"`);
      if (!tactics.includes('Urgency Tactics')) tactics.push('Urgency Tactics');
      hasUrgency = true;
      criticalIndicatorCount++;
    }
  });

  authorityImpersonation.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      scamScore += 20;
      detectedFlags.push(`Authority impersonation: "${keyword}"`);
      if (!tactics.includes('Authority Impersonation')) tactics.push('Authority Impersonation');
      hasAuthority = true;
      criticalIndicatorCount++;
    }
  });

  financialPressure.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      scamScore += 20;
      detectedFlags.push(`Financial pressure: "${keyword}"`);
      if (!tactics.includes('Financial Pressure')) tactics.push('Financial Pressure');
      hasFinancial = true;
      criticalIndicatorCount++;
    }
  });

  otpRequests.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      scamScore += 30;
      detectedFlags.push(`🚨 OTP/Security code request: "${keyword}"`);
      if (!tactics.includes('OTP Request')) tactics.push('OTP Request');
      hasOTP = true;
      criticalIndicatorCount++;
    }
  });

  emotionalManipulation.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      scamScore += 18;
      detectedFlags.push(`Emotional manipulation: "${keyword}"`);
      if (!tactics.includes('Emotional Manipulation')) tactics.push('Emotional Manipulation');
      criticalIndicatorCount++;
    }
  });

  secrecyPressure.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      scamScore += 22;
      detectedFlags.push(`🚨 Secrecy pressure: "${keyword}"`);
      if (!tactics.includes('Secrecy Pressure')) tactics.push('Secrecy Pressure');
      hasSecrecy = true;
      criticalIndicatorCount++;
    }
  });

  if ((hasFinancial || hasOTP) && hasUrgency) {
    scamScore += 25;
    detectedFlags.push('🚨 CRITICAL: Financial/OTP request with urgency');
    criticalIndicatorCount++;
  }

  if (hasAuthority && (hasFinancial || hasOTP)) {
    scamScore += 30;
    detectedFlags.push('🚨 CRITICAL: Authority impersonation with financial/OTP request');
    criticalIndicatorCount++;
  }

  if (hasSecrecy && (hasFinancial || hasOTP)) {
    scamScore += 25;
    detectedFlags.push('🚨 CRITICAL: Secrecy pressure with financial/OTP request');
    criticalIndicatorCount++;
  }

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let isSuspicious = false;
    let reason = '';

    if (urgencyKeywords.some(k => lowerSentence.includes(k))) {
      isSuspicious = true;
      reason = 'Contains urgency language';
    } else if (authorityImpersonation.some(k => lowerSentence.includes(k))) {
      isSuspicious = true;
      reason = 'Authority impersonation detected';
    } else if (otpRequests.some(k => lowerSentence.includes(k))) {
      isSuspicious = true;
      reason = '🚨 Requests OTP/sensitive information';
    } else if (financialPressure.some(k => lowerSentence.includes(k))) {
      isSuspicious = true;
      reason = 'Financial pressure tactics';
    } else if (secrecyPressure.some(k => lowerSentence.includes(k))) {
      isSuspicious = true;
      reason = 'Secrecy pressure detected';
    }

    if (isSuspicious) {
      suspiciousSentences.push({ text: sentence.trim(), reason });
    }
  });

  if (criticalIndicatorCount >= 3) {
    scamScore = Math.max(scamScore, 80);
  }

  if ((hasFinancial || hasOTP) && (hasAuthority || hasUrgency)) {
    scamScore = Math.max(scamScore, 85);
  }

  scamScore = Math.min(scamScore, 100);

  let deepfakeScore = calculateDeepfakeScore(transcript, lowerTranscript);

  if (audioData) {
    deepfakeScore = Math.max(deepfakeScore, audioData.aiConfidence);
    
    if (audioData.isAIGenerated) {
      detectedFlags.push('🚨 AI-generated voice detected');
      if (!tactics.includes('AI Voice Synthesis')) tactics.push('AI Voice Synthesis');
    }
  }

  const recommendations = generateVoiceRecommendations(scamScore, deepfakeScore, tactics, hasOTP, hasFinancial);

  return {
    transcript,
    scamScore,
    deepfakeScore,
    detectedFlags,
    suspiciousSentences,
    tactics,
    recommendations,
    audioData
  };
}

function calculateDeepfakeScore(transcript: string, lowerTranscript: string): number {
  let score = 0;

  const words = transcript.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = 1 - (uniqueWords.size / words.length);
  
  if (repetitionRatio > 0.3) {
    score += 25;
  }

  const unnaturalPatterns = [
    /\b(\w+)\s+\1\b/gi,
    /\b(um|uh|er)\b/gi,
  ];

  unnaturalPatterns.forEach(pattern => {
    const matches = transcript.match(pattern);
    if (matches && matches.length > 5) {
      score += 15;
    }
  });

  if (transcript.length < 50) {
    score += 20;
  }

  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgSentenceLength = transcript.length / sentences.length;
    if (avgSentenceLength < 20 || avgSentenceLength > 200) {
      score += 15;
    }
  }

  const roboticPhrases = ['this is', 'you must', 'you need to', 'please confirm'];
  let roboticCount = 0;
  roboticPhrases.forEach(phrase => {
    if (lowerTranscript.includes(phrase)) roboticCount++;
  });
  if (roboticCount >= 3) {
    score += 25;
  }

  return Math.min(score, 100);
}

function generateVoiceRecommendations(scamScore: number, deepfakeScore: number, tactics: string[], hasOTP: boolean, hasFinancial: boolean): string[] {
  const recommendations: string[] = [];

  if (scamScore > 75 || deepfakeScore > 65) {
    recommendations.push('🚨 CRITICAL: Hang up immediately - this is a scam call');
    recommendations.push('🚨 DO NOT provide any information');
    recommendations.push('🚨 DO NOT share OTP, passwords, PINs, or card details');
    recommendations.push('🚨 Block the number immediately');
    recommendations.push('🚨 Report to cybercrime.gov.in and your bank');
    
    if (hasOTP) {
      recommendations.push('⚠️ NEVER share OTP with anyone - banks/police never ask for OTP');
    }
    
    if (hasFinancial) {
      recommendations.push('⚠️ No legitimate organization demands immediate payment over phone');
      recommendations.push('⚠️ Check your bank accounts for unauthorized transactions');
    }
    
    if (deepfakeScore > 60) {
      recommendations.push('⚠️ Voice may be AI-generated (deepfake) - do not trust caller identity');
      recommendations.push('⚠️ Request video call or in-person verification');
    }
  } else if (scamScore > 40 || deepfakeScore > 40) {
    recommendations.push('⚠️ HIGH RISK: Exercise extreme caution');
    recommendations.push('⚠️ Verify caller identity through official channels');
    recommendations.push('⚠️ Do not share OTP, passwords, or financial details');
    recommendations.push('⚠️ Call back using official number from organization website');
    recommendations.push('⚠️ Do not act on urgency pressure');
  } else {
    recommendations.push('✓ Remain vigilant even with low-risk calls');
    recommendations.push('✓ Verify caller identity if unsure');
    recommendations.push('✓ Never share sensitive information over phone');
  }

  if (tactics.includes('Authority Impersonation')) {
    recommendations.push('📞 Government/banks never call demanding immediate action');
    recommendations.push('📞 Verify by calling official number (not number provided by caller)');
  }

  if (tactics.includes('Secrecy Pressure')) {
    recommendations.push('🚨 Legitimate organizations never ask you to keep calls secret');
  }

  return recommendations;
}

export async function transcribeAudio(audioBlob: Blob, isLiveRecording: boolean = false): Promise<{ transcript: string; audioData: AudioAnalysisData }> {
  const audioData = await analyzeAudioBuffer(audioBlob);
  
  let transcript = '';
  
  if (isLiveRecording) {
    // Use Web Speech API for live recordings
    try {
      transcript = await transcribeWithWebSpeechAPI();
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No transcript generated');
      }
    } catch (error) {
      console.error('Web Speech API error:', error);
      transcript = 'Unable to transcribe live recording. Please ensure microphone permissions are granted and speak clearly.';
    }
  } else {
    // For uploaded files, provide helpful message
    transcript = `Audio file uploaded successfully (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB, ${audioData.duration.toFixed(1)}s). 

Audio analysis completed:
• Average Pitch: ${audioData.averagePitch.toFixed(1)} Hz
• AI Detection: ${audioData.isAIGenerated ? 'AI-Generated Voice' : 'Human Voice'} (${audioData.aiConfidence}% confidence)
• Quality: Clarity ${audioData.qualityMetrics.clarity}%, Naturalness ${audioData.qualityMetrics.naturalness}%

Note: Automatic transcription requires OpenAI Whisper API key. To enable:
1. Get API key from https://platform.openai.com/api-keys
2. Add to .env.local: NEXT_PUBLIC_OPENAI_API_KEY=your-key
3. Restart the application

For now, you can:
• Use the "Record Audio" feature for live transcription (free)
• Manually transcribe and paste text for scam analysis
• View audio quality metrics above`;
  }
  
  return { transcript, audioData };
}

async function transcribeWithWebSpeechAPI(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser. Please use Chrome or Edge, or add OpenAI API key for Whisper transcription.'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    let finalTranscript = '';
    let timeoutId: NodeJS.Timeout;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        recognition.stop();
      }, 2000);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      recognition.stop();
      
      if (event.error === 'not-allowed') {
        reject(new Error('Microphone access denied. Please allow microphone permissions in your browser settings.'));
      } else if (event.error === 'no-speech') {
        reject(new Error('No speech detected. Please speak clearly into the microphone.'));
      } else if (finalTranscript.trim().length > 0) {
        resolve(finalTranscript.trim());
      } else {
        reject(new Error(`Speech recognition failed: ${event.error}`));
      }
    };

    recognition.onend = () => {
      clearTimeout(timeoutId);
      if (finalTranscript.trim().length > 0) {
        resolve(finalTranscript.trim());
      } else {
        reject(new Error('No speech detected. Please try recording again and speak clearly.'));
      }
    };

    try {
      recognition.start();
      
      timeoutId = setTimeout(() => {
        recognition.stop();
        if (finalTranscript.trim().length === 0) {
          reject(new Error('Recording timeout. No speech detected.'));
        }
      }, 60000);
    } catch (error) {
      reject(new Error('Failed to start speech recognition. Please check microphone permissions.'));
    }
  });
}

export async function transcribeWithWhisperAPI(audioBlob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  
  const fileName = audioBlob.type.includes('webm') ? 'audio.webm' : 
                   audioBlob.type.includes('mp3') ? 'audio.mp3' : 
                   audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.m4a';
  
  formData.append('file', audioBlob, fileName);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle quota exceeded error gracefully
      if (response.status === 429 || errorData.error?.code === 'rate_limit_exceeded') {
        throw new Error('QUOTA_EXCEEDED');
      }
      
      if (response.status === 401) {
        throw new Error('INVALID_API_KEY');
      }
      
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error: any) {
    console.error('Whisper API transcription error:', error);
    
    // Re-throw with specific error type
    if (error.message === 'QUOTA_EXCEEDED' || error.message === 'INVALID_API_KEY') {
      throw error;
    }
    
    throw new Error('WHISPER_API_ERROR');
  }
}
