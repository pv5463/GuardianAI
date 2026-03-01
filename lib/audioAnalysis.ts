export interface AudioAnalysisData {
  duration: number;
  averagePitch: number;
  pitchVariation: number;
  isAIGenerated: boolean;
  aiConfidence: number;
  frequencyData: {
    lowFreq: number;
    midFreq: number;
    highFreq: number;
  };
  qualityMetrics: {
    clarity: number;
    naturalness: number;
    consistency: number;
  };
}

export async function analyzeAudioBuffer(audioBlob: Blob): Promise<AudioAnalysisData> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const pitchData = analyzePitch(channelData, sampleRate);
    const frequencyData = analyzeFrequencies(channelData, sampleRate);
    const aiDetection = detectAIVoice(channelData, sampleRate, pitchData, frequencyData);
    const qualityMetrics = analyzeQuality(channelData, pitchData, frequencyData);

    await audioContext.close();

    return {
      duration,
      averagePitch: pitchData.average,
      pitchVariation: pitchData.variation,
      isAIGenerated: aiDetection.isAI,
      aiConfidence: aiDetection.confidence,
      frequencyData,
      qualityMetrics
    };
  } catch (error) {
    console.error('Audio analysis error:', error);
    await audioContext.close();
    throw error;
  }
}

function analyzePitch(channelData: Float32Array, sampleRate: number) {
  const windowSize = 2048;
  const pitches: number[] = [];
  
  for (let i = 0; i < channelData.length - windowSize; i += windowSize / 2) {
    const window = channelData.slice(i, i + windowSize);
    const pitch = detectPitchInWindow(window, sampleRate);
    if (pitch > 0) {
      pitches.push(pitch);
    }
  }

  const average = pitches.length > 0 
    ? pitches.reduce((a, b) => a + b, 0) / pitches.length 
    : 0;

  const variance = pitches.length > 0
    ? pitches.reduce((sum, pitch) => sum + Math.pow(pitch - average, 2), 0) / pitches.length
    : 0;
  
  const variation = Math.sqrt(variance);

  return { average, variation, samples: pitches };
}

function detectPitchInWindow(window: Float32Array, sampleRate: number): number {
  const autocorrelation = new Float32Array(window.length);
  
  for (let lag = 0; lag < window.length; lag++) {
    let sum = 0;
    for (let i = 0; i < window.length - lag; i++) {
      sum += window[i] * window[i + lag];
    }
    autocorrelation[lag] = sum;
  }

  let maxCorrelation = -1;
  let maxLag = 0;
  const minLag = Math.floor(sampleRate / 500);
  const maxLagLimit = Math.floor(sampleRate / 50);

  for (let lag = minLag; lag < maxLagLimit && lag < autocorrelation.length; lag++) {
    if (autocorrelation[lag] > maxCorrelation) {
      maxCorrelation = autocorrelation[lag];
      maxLag = lag;
    }
  }

  if (maxLag > 0 && maxCorrelation > 0.1) {
    return sampleRate / maxLag;
  }

  return 0;
}

function analyzeFrequencies(channelData: Float32Array, sampleRate: number) {
  const fftSize = 2048;
  const frequencyBins = new Float32Array(fftSize);
  
  for (let i = 0; i < Math.min(fftSize, channelData.length); i++) {
    frequencyBins[i] = channelData[i];
  }

  const fft = performFFT(frequencyBins);
  const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));

  const lowFreqEnd = Math.floor((300 / sampleRate) * fftSize);
  const midFreqEnd = Math.floor((3000 / sampleRate) * fftSize);
  
  const lowFreq = magnitudes.slice(0, lowFreqEnd).reduce((a, b) => a + b, 0) / lowFreqEnd;
  const midFreq = magnitudes.slice(lowFreqEnd, midFreqEnd).reduce((a, b) => a + b, 0) / (midFreqEnd - lowFreqEnd);
  const highFreq = magnitudes.slice(midFreqEnd).reduce((a, b) => a + b, 0) / (magnitudes.length - midFreqEnd);

  return {
    lowFreq: Math.round(lowFreq * 100) / 100,
    midFreq: Math.round(midFreq * 100) / 100,
    highFreq: Math.round(highFreq * 100) / 100
  };
}

function performFFT(data: Float32Array): Array<{ real: number; imag: number }> {
  const n = data.length;
  const result: Array<{ real: number; imag: number }> = [];
  
  for (let k = 0; k < n; k++) {
    let real = 0;
    let imag = 0;
    
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      real += data[t] * Math.cos(angle);
      imag -= data[t] * Math.sin(angle);
    }
    
    result.push({ real, imag });
  }
  
  return result;
}

function detectAIVoice(
  channelData: Float32Array,
  sampleRate: number,
  pitchData: { average: number; variation: number; samples: number[] },
  frequencyData: { lowFreq: number; midFreq: number; highFreq: number }
): { isAI: boolean; confidence: number } {
  let aiScore = 0;

  if (pitchData.variation < 20) {
    aiScore += 25;
  }

  const pitchConsistency = calculateConsistency(pitchData.samples);
  if (pitchConsistency > 0.85) {
    aiScore += 30;
  }

  const freqRatio = frequencyData.midFreq / (frequencyData.lowFreq + frequencyData.highFreq + 0.01);
  if (freqRatio > 2.5 || freqRatio < 0.4) {
    aiScore += 20;
  }

  const zeroCrossings = countZeroCrossings(channelData);
  const zeroCrossingRate = zeroCrossings / channelData.length;
  if (zeroCrossingRate < 0.01 || zeroCrossingRate > 0.15) {
    aiScore += 15;
  }

  const energyVariation = calculateEnergyVariation(channelData);
  if (energyVariation < 0.3) {
    aiScore += 10;
  }

  const confidence = Math.min(aiScore, 100);
  const isAI = confidence > 50;

  return { isAI, confidence };
}

function calculateConsistency(samples: number[]): number {
  if (samples.length < 2) return 0;
  
  const differences = [];
  for (let i = 1; i < samples.length; i++) {
    differences.push(Math.abs(samples[i] - samples[i - 1]));
  }
  
  const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
  const maxDiff = Math.max(...differences);
  
  return maxDiff > 0 ? 1 - (avgDiff / maxDiff) : 1;
}

function countZeroCrossings(data: Float32Array): number {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      count++;
    }
  }
  return count;
}

function calculateEnergyVariation(data: Float32Array): number {
  const windowSize = 1024;
  const energies: number[] = [];
  
  for (let i = 0; i < data.length - windowSize; i += windowSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += data[i + j] * data[i + j];
    }
    energies.push(energy / windowSize);
  }
  
  if (energies.length < 2) return 0;
  
  const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const variance = energies.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energies.length;
  
  return Math.sqrt(variance) / (avgEnergy + 0.0001);
}

function analyzeQuality(
  channelData: Float32Array,
  pitchData: { average: number; variation: number },
  frequencyData: { lowFreq: number; midFreq: number; highFreq: number }
) {
  const snr = calculateSNR(channelData);
  const clarity = Math.min(snr / 30, 1) * 100;

  const naturalness = calculateNaturalness(pitchData, frequencyData);

  const consistency = calculateSignalConsistency(channelData);

  return {
    clarity: Math.round(clarity),
    naturalness: Math.round(naturalness),
    consistency: Math.round(consistency)
  };
}

function calculateSNR(data: Float32Array): number {
  const signal = data.reduce((sum, val) => sum + val * val, 0) / data.length;
  const noise = 0.001;
  return 10 * Math.log10(signal / noise);
}

function calculateNaturalness(
  pitchData: { average: number; variation: number },
  frequencyData: { lowFreq: number; midFreq: number; highFreq: number }
): number {
  let score = 100;

  if (pitchData.average < 80 || pitchData.average > 300) {
    score -= 20;
  }

  if (pitchData.variation < 10 || pitchData.variation > 100) {
    score -= 25;
  }

  const totalFreq = frequencyData.lowFreq + frequencyData.midFreq + frequencyData.highFreq;
  if (totalFreq > 0) {
    const midRatio = frequencyData.midFreq / totalFreq;
    if (midRatio < 0.3 || midRatio > 0.7) {
      score -= 15;
    }
  }

  return Math.max(score, 0);
}

function calculateSignalConsistency(data: Float32Array): number {
  const windowSize = 2048;
  const correlations: number[] = [];
  
  for (let i = 0; i < data.length - windowSize * 2; i += windowSize) {
    const window1 = data.slice(i, i + windowSize);
    const window2 = data.slice(i + windowSize, i + windowSize * 2);
    
    const correlation = calculateCorrelation(window1, window2);
    correlations.push(correlation);
  }
  
  const avgCorrelation = correlations.length > 0
    ? correlations.reduce((a, b) => a + b, 0) / correlations.length
    : 0;
  
  return Math.max(0, Math.min(100, avgCorrelation * 100));
}

function calculateCorrelation(arr1: Float32Array, arr2: Float32Array): number {
  const n = Math.min(arr1.length, arr2.length);
  let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
  
  for (let i = 0; i < n; i++) {
    sum1 += arr1[i];
    sum2 += arr2[i];
    sum1Sq += arr1[i] * arr1[i];
    sum2Sq += arr2[i] * arr2[i];
    pSum += arr1[i] * arr2[i];
  }
  
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  
  return den === 0 ? 0 : num / den;
}
