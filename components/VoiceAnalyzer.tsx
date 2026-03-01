'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Upload, StopCircle, Loader2, AlertTriangle, FileAudio, X, CheckCircle } from 'lucide-react';
import { analyzeVoiceTranscript, transcribeAudio, transcribeWithWhisperAPI, type VoiceAnalysisResult } from '@/lib/voiceAnalysis';
import { supabase } from '@/lib/supabase';
import { uploadAudioFile, validateAudioFile } from '@/lib/storageUtils';
import RiskMeter from './RiskMeter';

export default function VoiceAnalyzer() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsLiveRecording(true);
      setRecordingTime(0);
      setError('');
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permissions in your browser settings.');
      } else {
        setError('Could not access microphone. Please check your device and browser settings.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setAudioBlob(file);
    setIsLiveRecording(false);
    setError('');
    setResult(null);
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setUploadedFile(null);
    setResult(null);
    setError('');
    setRecordingTime(0);
    setIsLiveRecording(false);
  };

  const analyzeAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to analyze audio');
        setIsProcessing(false);
        return;
      }

      setProgress(20);
      setIsUploading(true);

      const audioFile = uploadedFile || new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadResult = await uploadAudioFile(user.id, audioFile);

      setIsUploading(false);

      if (!uploadResult.success) {
        setError(uploadResult.error || 'Upload failed');
        setIsProcessing(false);
        return;
      }

      setProgress(40);

      let transcript = '';
      let audioData;

      const whisperApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      try {
        if (whisperApiKey && !isLiveRecording) {
          setProgress(50);
          try {
            transcript = await transcribeWithWhisperAPI(audioBlob, whisperApiKey);
            const { audioData: analyzedData } = await transcribeAudio(audioBlob, isLiveRecording);
            audioData = analyzedData;
          } catch (whisperError: any) {
            if (whisperError.message === 'QUOTA_EXCEEDED') {
              const result = await transcribeAudio(audioBlob, isLiveRecording);
              transcript = result.transcript;
              audioData = result.audioData;
            } else if (whisperError.message === 'INVALID_API_KEY') {
              setError('Invalid OpenAI API key. Please check your .env.local configuration.');
              setIsProcessing(false);
              return;
            } else {
              throw whisperError;
            }
          }
        } else {
          const result = await transcribeAudio(audioBlob, isLiveRecording);
          transcript = result.transcript;
          audioData = result.audioData;
        }
      } catch (transcriptionError: any) {
        console.error('Transcription failed:', transcriptionError);
        setError(transcriptionError.message || 'Failed to transcribe audio. Please ensure the audio contains clear speech and try again.');
        setIsProcessing(false);
        return;
      }

      if (!transcript || transcript.trim().length === 0) {
        setError('No speech detected in the audio. Please record or upload audio with clear speech.');
        setIsProcessing(false);
        return;
      }

      // Check if transcript is informational message (not actual speech)
      if (transcript.includes('Audio file uploaded successfully') || transcript.includes('Automatic transcription requires')) {
        // Show audio analysis without scam detection
        setProgress(100);
        setResult({
          transcript,
          scamScore: 0,
          deepfakeScore: 0,
          detectedFlags: [],
          suspiciousSentences: [],
          tactics: [],
          recommendations: [
            '✓ Audio file uploaded and analyzed successfully',
            '✓ To enable automatic transcription, add OpenAI Whisper API key',
            '✓ Use "Record Audio" feature for free live transcription',
            '✓ Or manually transcribe and paste text for scam analysis'
          ],
          audioData
        });
        setIsProcessing(false);
        return;
      }
      
      setProgress(70);
      await new Promise(resolve => setTimeout(resolve, 500));

      const analysis = analyzeVoiceTranscript(transcript, audioData);
      
      setProgress(90);

      await supabase.from('voice_scans').insert({
        user_id: user.id,
        transcript: analysis.transcript,
        scam_score: analysis.scamScore,
        deepfake_score: analysis.deepfakeScore,
        detected_flags: analysis.detectedFlags,
        audio_duration: recordingTime,
        file_url: uploadResult.url,
        scam_type: 'Deepfake Call'
      });

      setProgress(100);
      setResult(analysis);
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError('Failed to analyze audio. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
      setProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    if (score < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskLevelFromScore = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 85) return 'high';
    return 'critical';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Voice Scam Analyzer</h2>

        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm">
            🎤 Record audio for live transcription (Chrome/Edge) or upload files with Whisper API key for best results.
          </p>
        </div>

        {!process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Whisper API not configured. Uploaded files will show audio analysis only. Use "Record Audio" for free live transcription.
            </p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-3 p-6 rounded-xl font-semibold transition-all ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 animate-pulse'
                : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border-2 border-blue-500/50 hover:border-blue-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <>
                <StopCircle className="w-6 h-6" />
                Stop Recording ({formatTime(recordingTime)})
              </>
            ) : (
              <>
                <Mic className="w-6 h-6" />
                Record Audio
              </>
            )}
          </motion.button>

          <label className="flex items-center justify-center gap-3 p-6 rounded-xl font-semibold bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-white border-2 border-purple-500/50 hover:border-purple-400 transition-all cursor-pointer">
            <Upload className="w-6 h-6" />
            Upload Audio File
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={isProcessing || isRecording}
              className="hidden"
            />
          </label>
        </div>

        {audioBlob && !isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {uploadedFile ? (
                    <>
                      <FileAudio className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-gray-300 font-medium">{uploadedFile.name}</p>
                        <p className="text-gray-500 text-sm">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300">
                        Recording ready ({formatTime(recordingTime)})
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={clearAudio}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={analyzeAudio}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isUploading ? 'Uploading...' : `Analyzing... ${progress}%`}
                </>
              ) : (
                'Analyze Audio'
              )}
            </motion.button>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-gray-300">Processing audio...</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {result.scamScore === 0 && result.deepfakeScore === 0 && result.detectedFlags.length === 0 ? (
              // Audio analysis only (no transcription)
              <>
                {result.audioData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">Audio Analysis Results</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400 text-sm mb-2">Average Pitch</p>
                        <p className="text-white text-2xl font-bold">{result.audioData.averagePitch.toFixed(1)} Hz</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400 text-sm mb-2">Pitch Variation</p>
                        <p className="text-white text-2xl font-bold">{result.audioData.pitchVariation.toFixed(1)} Hz</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400 text-sm mb-2">AI Detection</p>
                        <p className={`text-2xl font-bold ${result.audioData.isAIGenerated ? 'text-red-400' : 'text-green-400'}`}>
                          {result.audioData.isAIGenerated ? 'AI Generated' : 'Human Voice'}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">Confidence: {result.audioData.aiConfidence}%</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400 text-sm mb-2">Audio Duration</p>
                        <p className="text-white text-2xl font-bold">{result.audioData.duration.toFixed(1)}s</p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                      <p className="text-gray-400 text-sm mb-3">Quality Metrics</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Clarity</span>
                            <span className="text-white">{result.audioData.qualityMetrics.clarity}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${result.audioData.qualityMetrics.clarity}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Naturalness</span>
                            <span className="text-white">{result.audioData.qualityMetrics.naturalness}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${result.audioData.qualityMetrics.naturalness}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Consistency</span>
                            <span className="text-white">{result.audioData.qualityMetrics.consistency}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${result.audioData.qualityMetrics.consistency}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Information</h3>
                  <div className="bg-gray-800/50 rounded-xl p-4 max-h-60 overflow-y-auto">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{result.transcript}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Next Steps</h3>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        <p className="text-gray-300">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </>
            ) : (
              // Full scam analysis
              <>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4">Scam Risk Score</h3>
                <RiskMeter score={result.scamScore} riskLevel={getRiskLevelFromScore(result.scamScore)} />
                <p className={`text-center text-4xl font-bold mt-4 ${getRiskColor(result.scamScore)}`}>
                  {result.scamScore}%
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4">Deepfake Likelihood</h3>
                <RiskMeter score={result.deepfakeScore} riskLevel={getRiskLevelFromScore(result.deepfakeScore)} />
                <p className={`text-center text-4xl font-bold mt-4 ${getRiskColor(result.deepfakeScore)}`}>
                  {result.deepfakeScore}%
                </p>
              </motion.div>
            </div>

            {result.tactics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Detected Tactics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.tactics.map((tactic, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 font-medium"
                    >
                      {tactic}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {result.audioData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4">Audio Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Average Pitch</p>
                    <p className="text-white text-2xl font-bold">{result.audioData.averagePitch.toFixed(1)} Hz</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Pitch Variation</p>
                    <p className="text-white text-2xl font-bold">{result.audioData.pitchVariation.toFixed(1)} Hz</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">AI Detection</p>
                    <p className={`text-2xl font-bold ${result.audioData.isAIGenerated ? 'text-red-400' : 'text-green-400'}`}>
                      {result.audioData.isAIGenerated ? 'AI Generated' : 'Human Voice'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Confidence: {result.audioData.aiConfidence}%</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Audio Duration</p>
                    <p className="text-white text-2xl font-bold">{result.audioData.duration.toFixed(1)}s</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-3">Quality Metrics</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Clarity</span>
                        <span className="text-white">{result.audioData.qualityMetrics.clarity}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${result.audioData.qualityMetrics.clarity}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Naturalness</span>
                        <span className="text-white">{result.audioData.qualityMetrics.naturalness}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${result.audioData.qualityMetrics.naturalness}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Consistency</span>
                        <span className="text-white">{result.audioData.qualityMetrics.consistency}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${result.audioData.qualityMetrics.consistency}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Transcript</h3>
              <div className="bg-gray-800/50 rounded-xl p-4 max-h-60 overflow-y-auto">
                <p className="text-gray-300 leading-relaxed">{result.transcript}</p>
              </div>
            </motion.div>

            {result.suspiciousSentences.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4">Suspicious Sentences</h3>
                <div className="space-y-3">
                  {result.suspiciousSentences.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                    >
                      <p className="text-gray-300 mb-2">"{item.text}"</p>
                      <p className="text-sm text-red-400">⚠️ {item.reason}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Recommendations</h3>
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <p className="text-gray-300">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
