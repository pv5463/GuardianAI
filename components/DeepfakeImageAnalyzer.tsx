'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Loader2, FileImage, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { uploadScreenshot, validateImageFile } from '@/lib/storageUtils';
import { detectDeepfakePatterns } from '@/lib/aiEngineClient';
import { saveScanToDatabase } from '@/lib/metricsEngine';
import AnalysisCard from './AnalysisCard';

interface DeepfakeImageAnalyzerProps {
  userId: string;
}

export default function DeepfakeImageAnalyzer({ userId }: DeepfakeImageAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setAnalyzing(true);
      setError('');

      // Call AI Engine for deepfake detection
      const analysisResult = await detectDeepfakePatterns(userId, selectedFile);

      // Upload to storage
      const uploadResult = await uploadScreenshot(userId, selectedFile);

      // Save to database
      await saveScanToDatabase(userId, 'deepfake_image', selectedFile.name, {
        score: analysisResult.risk_score,
        riskLevel: analysisResult.risk_level.toLowerCase(),
        redFlags: analysisResult.explanation,
        explanation: analysisResult.explanation.join('. '),
        recommendations: analysisResult.recommendations || [],
        detectedIndicators: analysisResult.threats_detected || [],
        aiEngineUsed: true,
        file_url: uploadResult.url,
        details: analysisResult.details
      });

      setResult({
        score: analysisResult.risk_score,
        riskLevel: analysisResult.risk_level.toLowerCase(),
        redFlags: analysisResult.explanation,
        explanation: analysisResult.explanation.join('. '),
        recommendations: analysisResult.recommendations || [],
        detectedIndicators: analysisResult.threats_detected || [],
        details: analysisResult.details
      });

      setAnalyzing(false);

    } catch (err: any) {
      console.error('Deepfake analysis error:', err);
      setError(err.message || 'Failed to analyze image. Make sure AI Engine is running.');
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <ImageIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deepfake & Dark Pattern Analyzer</h2>
            <p className="text-gray-400 text-sm">AI-powered image analysis for deceptive patterns</p>
          </div>
        </div>

        {!selectedFile ? (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-purple-500 transition-all">
              <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2">
                Upload Image for Analysis
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Click to select or drag and drop
              </p>
              <p className="text-gray-500 text-xs">
                Supports JPG, PNG, WebP (Max 10MB)
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-gray-700">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-96 object-contain bg-gray-900"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
              <FileImage className="w-5 h-5 text-purple-400" />
              <div className="flex-1">
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!analyzing && !result && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-semibold mb-1">Analysis Failed</p>
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-purple-300">
                    Analyzing image for deepfake and dark patterns...
                  </span>
                </div>
              </motion.div>
            )}

            {!result && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Analyze Image
                  </>
                )}
              </motion.button>
            )}
          </div>
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
            <AnalysisCard
              result={result}
              title="Deepfake Analysis Results"
            />
            
            {result.details && result.details.detections && result.details.detections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Detected UI Elements</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {result.details.detections.map((detection: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-purple-400 font-semibold text-sm capitalize">{detection.class}</p>
                      <p className="text-gray-400 text-xs">Confidence: {(detection.confidence * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {result.details && result.details.pattern_analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Pattern Analysis</h3>
                <div className="space-y-3">
                  {Object.entries(result.details.pattern_analysis.element_counts || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-purple-400 font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
