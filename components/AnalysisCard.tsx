'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Cpu } from 'lucide-react';
import AnimatedRiskMeter from './ui/AnimatedRiskMeter';
import AIExplanationPanel from './ui/AIExplanationPanel';
import GlassCard from './ui/GlassCard';

interface ScamAnalysisResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  redFlags: string[];
  explanation: string;
  recommendations: string[];
  detectedIndicators: string[];
  aiEngineUsed?: boolean;
}

interface AnalysisCardProps {
  result: ScamAnalysisResult;
  title: string;
}

export default function AnalysisCard({ result, title }: AnalysisCardProps) {
  return (
    <GlassCard hover={false}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {result.aiEngineUsed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 border border-cyber-blue/50 rounded-full shadow-glow-blue"
          >
            <Cpu className="w-4 h-4 text-cyber-blue" />
            <span className="text-xs font-medium text-cyber-blue">AI Engine</span>
          </motion.div>
        )}
      </div>
      
      <AnimatedRiskMeter score={result.score} riskLevel={result.riskLevel} />
      
      <div className="mt-6 p-4 bg-gradient-to-br from-glass-light to-transparent rounded-xl border border-white/10">
        <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
      </div>
      
      {result.redFlags.length > 0 && (
        <div className="mt-6">
          <AIExplanationPanel 
            title={`🚨 Red Flags Detected (${result.redFlags.length})`}
            reasons={result.redFlags}
            variant="danger"
          />
        </div>
      )}
      
      <div className="mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-cyber-green/10 to-emerald-500/10 border border-cyber-green/30 rounded-xl p-5"
        >
          <h4 className="text-sm font-semibold text-cyber-green mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Recommended Actions
          </h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-sm text-gray-300 flex items-start gap-3 group"
              >
                <motion.span 
                  className="text-cyber-green mt-1 text-base"
                  whileHover={{ scale: 1.3 }}
                >
                  ✓
                </motion.span>
                <span className="group-hover:text-white transition-colors">{rec}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </GlassCard>
  );
}
