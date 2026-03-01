'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import RiskMeter from './RiskMeter';
import type { ScamAnalysisResult } from '@/lib/scamDetection';

interface AnalysisCardProps {
  result: ScamAnalysisResult;
  title: string;
}

export default function AnalysisCard({ result, title }: AnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      
      <RiskMeter score={result.score} riskLevel={result.riskLevel} />
      
      <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
        <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
      </div>
      
      {result.redFlags.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Red Flags Detected ({result.redFlags.length})
          </h4>
          <ul className="space-y-2">
            {result.redFlags.map((flag, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-400 flex items-start gap-2"
              >
                <span className="text-red-500 mt-1">•</span>
                <span>{flag}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Recommended Actions
        </h4>
        <ul className="space-y-2">
          {result.recommendations.map((rec, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="text-sm text-gray-400 flex items-start gap-2"
            >
              <span className="text-green-500 mt-1">✓</span>
              <span>{rec}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
