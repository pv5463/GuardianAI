'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Shield, AlertOctagon, Skull } from 'lucide-react';

interface RiskMeterProps {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function RiskMeter({ score, riskLevel }: RiskMeterProps) {
  const getColor = () => {
    if (riskLevel === 'low') return { bg: 'from-green-500 to-emerald-600', text: 'text-green-400', glow: 'shadow-green-500/50' };
    if (riskLevel === 'medium') return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' };
    if (riskLevel === 'high') return { bg: 'from-orange-500 to-red-500', text: 'text-orange-400', glow: 'shadow-orange-500/50' };
    return { bg: 'from-red-600 to-rose-700', text: 'text-red-400', glow: 'shadow-red-500/50' };
  };
  
  const getIcon = () => {
    if (riskLevel === 'low') return <Shield className="w-8 h-8" />;
    if (riskLevel === 'medium') return <AlertTriangle className="w-8 h-8" />;
    if (riskLevel === 'high') return <AlertOctagon className="w-8 h-8" />;
    return <Skull className="w-8 h-8" />;
  };
  
  const colors = getColor();
  
  return (
    <div className="relative">
      <div className="flex items-center justify-center mb-6">
        <motion.div
          className={`${colors.text}`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
        >
          {getIcon()}
        </motion.div>
      </div>
      
      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.bg} ${colors.glow} shadow-lg`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>Safe</span>
        <motion.span
          className={`font-bold ${colors.text}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {score}% Risk
        </motion.span>
        <span>Dangerous</span>
      </div>
      
      <motion.div
        className={`mt-4 text-center text-lg font-bold uppercase tracking-wider ${colors.text}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {riskLevel} Risk
      </motion.div>
    </div>
  );
}
