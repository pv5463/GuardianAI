'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, AlertTriangle, FileAudio, X, Mic, Brain, Shield } from 'lucide-react';
import { analyzeVoiceDeepfake } from '@/lib/aiEngineClient';
import AnimatedRiskMeter from './ui/AnimatedRiskMeter';
import AIExplanationPanel from './ui/AIExplanationPanel';
import GlassCard from './ui/GlassCard';
import ThreatCard from './ui/ThreatCard';

interface VoiceDeepfakeResult {
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
}

export default function VoiceDeepfakeAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VoiceDeepfakeResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/flac'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|m4a|ogg|flac)$/i)) {
      setError('Unsupported file format. Please upload .wav, .mp3, .m4a, .ogg, or .flac files.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
      return;
    }

    setUploadedFile(file);
    setError('');
    setResult(null);
    
    // Create audio URL for playback
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const clearAudio = () => {
    setUploadedFile(null);
    setResult(null);
    setError('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
  };

  const analyzeAudio = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const analysisResult = await analyzeVoiceDeepfake(uploadedFile);
      setResult(analysisResult);
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze audio. Please ensure the AI Engine is running and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    if (score < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 85) return 'high';
    return 'critical';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'High') return 'text-green-400';
    if (confidence === 'Medium') return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6">
      <GlassCard hover={false}>
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 rounded-xl border border-cyber-purple/30"
          >
            <Brain className="w-8 h-8 text-cyber-purple" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyber-purple to-cyber-pink bg-clip-text text-transparent">
              AI Voice Deepfake Detector
            </h2>
            <p className="text-gray-400 text-sm">Detect AI-generated voices with explainable analysis</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10 border border-cyber-blue/30 rounded-lg"
        >
          <p className="text-cyber-blue text-sm flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Upload an audio file to analyze if the voice is AI-generated or human. 
              Supports .wav, .mp3, .m4a, .ogg, .flac (max 10MB).
            </span>
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 p-3 bg-gradient-to-r from-cyber-yellow/10 to-orange-500/10 border border-cyber-yellow/30 rounded-lg"
        >
          <p className="text-cyber-yellow text-xs">
            ⚠️ Disclaimer: This analysis provides probability-based results and may not be 100% accurate. 
            Always verify caller identity through official channels for sensitive matters.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-gradient-to-r from-cyber-red/10 to-pink-500/10 border border-cyber-red/30 rounded-lg shadow-glow-red"
          >
            <p className="text-cyber-red text-sm">{error}</p>
          </motion.div>
        )}

        <motion.label 
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-3 p-8 rounded-xl font-semibold bg-gradient-to-r from-cyber-purple/20 to-cyber-pink/20 text-white border-2 border-cyber-purple/50 hover:border-cyber-purple transition-all cursor-pointer group relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <Upload className="w-6 h-6 group-hover:scale-110 transition-transform relative z-10" />
          <span className="relative z-10">Upload Audio File</span>
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac"
            onChange={handleFileUpload}
            disabled={isAnalyzing}
            className="hidden"
          />
        </motion.label>

        {uploadedFile && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6"
          >
            <div className="bg-gradient-to-br from-glass-light to-transparent backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-2 bg-cyber-purple/20 rounded-lg"
                  >
                    <FileAudio className="w-5 h-5 text-cyber-purple" />
                  </motion.div>
                  <div>
                    <p className="text-gray-300 font-medium">{uploadedFile.name}</p>
                    <p className="text-gray-500 text-sm">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={clearAudio}
                  className="p-2 hover:bg-cyber-red/20 rounded-lg transition-all border border-transparent hover:border-cyber-red/30"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-cyber-red" />
                </motion.button>
              </div>

              {audioUrl && (
                <audio controls className="w-full mt-3 rounded-lg">
                  <source src={audioUrl} type={uploadedFile.type} />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={analyzeAudio}
              disabled={isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white font-semibold rounded-xl shadow-glow-purple hover:shadow-glow-pink transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: isAnalyzing ? ['-100%', '200%'] : '-100%' }}
                transition={{ duration: 1.5, repeat: isAnalyzing ? Infinity : 0, ease: 'linear' }}
              />
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Analyzing Voice...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Analyze for AI Voice</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </GlassCard>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Risk Score */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">AI Voice Detection Score</h3>
              <AnimatedRiskMeter score={result.risk_score} riskLevel={getRiskLevel(result.risk_score)} size="lg" />
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className={`text-center text-5xl font-bold mt-4 ${getRiskColor(result.risk_score)}`}
              >
                {result.risk_score}%
              </motion.p>
              <p className="text-center text-gray-400 mt-2">
                Risk of AI-Generated Voice
              </p>
            </GlassCard>

            {/* Classification */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">Classification</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-glass-light to-transparent rounded-lg border border-white/10"
                >
                  <p className="text-gray-400 text-sm mb-2">Voice Type</p>
                  <p className={`text-2xl font-bold ${
                    result.classification.includes('AI') ? 'text-cyber-red' : 'text-cyber-green'
                  }`}>
                    {result.classification}
                  </p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-glass-light to-transparent rounded-lg border border-white/10"
                >
                  <p className="text-gray-400 text-sm mb-2">Confidence Level</p>
                  <p className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                    {result.confidence}
                  </p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-glass-light to-transparent rounded-lg border border-white/10"
                >
                  <p className="text-gray-400 text-sm mb-2">Audio Duration</p>
                  <p className="text-white text-2xl font-bold">{result.audio_duration.toFixed(1)}s</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-glass-light to-transparent rounded-lg border border-white/10"
                >
                  <p className="text-gray-400 text-sm mb-2">Sample Rate</p>
                  <p className="text-white text-2xl font-bold">{(result.sample_rate / 1000).toFixed(1)} kHz</p>
                </motion.div>
              </div>
            </GlassCard>

            {/* Features Detected */}
            {result.features_detected.length > 0 && (
              <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-cyber-purple" />
                  Detected Features
                </h3>
                <div className="space-y-2">
                  {result.features_detected.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className={`p-3 rounded-lg border ${
                        feature.includes('AI trait') || feature.includes('Unnatural')
                          ? 'bg-cyber-red/10 border-cyber-red/30'
                          : 'bg-cyber-green/10 border-cyber-green/30'
                      }`}
                    >
                      <p className={feature.includes('AI trait') || feature.includes('Unnatural') ? 'text-cyber-red' : 'text-cyber-green'}>
                        {feature.includes('AI trait') || feature.includes('Unnatural') ? '⚠️' : '✓'} {feature}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Explanation */}
            <AIExplanationPanel 
              title="🧠 Analysis Explanation"
              reasons={result.explanation}
              variant="primary"
            />

            {/* Recommended Action */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">Recommended Action</h3>
              <div className={`p-4 rounded-lg border ${
                result.risk_score >= 70
                  ? 'bg-cyber-red/10 border-cyber-red/30'
                  : result.risk_score >= 40
                  ? 'bg-cyber-yellow/10 border-cyber-yellow/30'
                  : 'bg-cyber-green/10 border-cyber-green/30'
              }`}>
                <p className={
                  result.risk_score >= 70
                    ? 'text-cyber-red'
                    : result.risk_score >= 40
                    ? 'text-cyber-yellow'
                    : 'text-cyber-green'
                }>
                  {result.recommended_action}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
