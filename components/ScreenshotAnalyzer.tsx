'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Loader2, FileImage, X, CheckCircle } from 'lucide-react';
import { uploadScreenshot, validateImageFile } from '@/lib/storageUtils';
import { extractTextFromImage } from '@/lib/ocrUtils';
import { analyzeText } from '@/lib/scamDetection';
import { saveScanToDatabase, calculateThreatBreakdown } from '@/lib/metricsEngine';
import AnalysisCard from './AnalysisCard';
import ThreatBreakdown from './analytics/ThreatBreakdown';
import PsychologicalTactics from './analytics/PsychologicalTactics';
import { extractPsychologicalTactics } from '@/lib/metricsEngine';
import ActionPanel from './ActionPanel';

interface ScreenshotAnalyzerProps {
  userId: string;
}

export default function ScreenshotAnalyzer({ userId }: ScreenshotAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [threatBreakdown, setThreatBreakdown] = useState<any>(null);
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
    setExtractedText('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError('');

      const uploadResult = await uploadScreenshot(userId, selectedFile);
      
      if (!uploadResult.success) {
        setError(uploadResult.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setUploading(false);
      setExtracting(true);
      setOcrProgress(0);

      const ocrResult = await extractTextFromImage(selectedFile, (progress) => {
        setOcrProgress(progress);
      });

      setExtracting(false);

      if (!ocrResult.success || !ocrResult.text) {
        setError(ocrResult.error || 'Failed to extract text');
        return;
      }

      setExtractedText(ocrResult.text);
      setAnalyzing(true);

      await new Promise(resolve => setTimeout(resolve, 500));

      const analysisResult = analyzeText(ocrResult.text);
      const breakdown = calculateThreatBreakdown(ocrResult.text);

      await saveScanToDatabase(userId, 'screenshot', ocrResult.text, {
        ...analysisResult,
        file_url: uploadResult.url
      });

      setResult(analysisResult);
      setThreatBreakdown(breakdown);
      setAnalyzing(false);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError('An error occurred during analysis');
      setUploading(false);
      setExtracting(false);
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText('');
    setResult(null);
    setThreatBreakdown(null);
    setError('');
    setOcrProgress(0);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Screenshot Analyzer</h2>

        {!selectedFile ? (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-blue-500 transition-all">
              <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2">
                Upload Screenshot
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
              <FileImage className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!uploading && !extracting && !analyzing && !result && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {(uploading || extracting || analyzing) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-blue-300">
                    {uploading && 'Uploading screenshot...'}
                    {extracting && `Extracting text... ${ocrProgress}%`}
                    {analyzing && 'Analyzing content...'}
                  </span>
                </div>
                {extracting && (
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ocrProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {extractedText && !result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <h3 className="text-green-400 font-semibold mb-2">Extracted Text:</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {extractedText}
                </p>
              </motion.div>
            )}

            {!result && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={uploading || extracting || analyzing}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(uploading || extracting || analyzing) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Analyze Screenshot
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
              title="Screenshot Analysis Results"
            />
            {threatBreakdown && (
              <ThreatBreakdown
                urgencyScore={threatBreakdown.urgencyScore}
                impersonationScore={threatBreakdown.impersonationScore}
                financialScore={threatBreakdown.financialScore}
                technicalScore={threatBreakdown.technicalScore}
              />
            )}
            {result.detectedIndicators && result.detectedIndicators.length > 0 && (
              <PsychologicalTactics 
                tactics={extractPsychologicalTactics(result.redFlags)} 
              />
            )}
            <ActionPanel riskLevel={result.riskLevel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
