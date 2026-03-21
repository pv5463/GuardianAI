'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Shield, AlertOctagon, Skull } from 'lucide-react';

interface AnimatedRiskMeterProps {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function AnimatedRiskMeter({ 
  score, 
  riskLevel, 
  size = 'md',
  showIcon = true 
}: AnimatedRiskMeterProps) {
  const getColor = () => {
    if (riskLevel === 'low') return { 
      bg: 'from-cyber-green to-emerald-400', 
      text: 'text-cyber-green', 
      glow: 'shadow-glow-green',
      ring: 'ring-cyber-green/20'
    };
    if (riskLevel === 'medium') return { 
      bg: 'from-cyber-yellow to-yellow-400', 
      text: 'text-cyber-yellow', 
      glow: 'shadow-glow-yellow',
      ring: 'ring-cyber-yellow/20'
    };
    if (riskLevel === 'high') return { 
      bg: 'from-orange-500 to-cyber-red', 
      text: 'text-orange-400', 
      glow: 'shadow-glow-red',
      ring: 'ring-orange-500/20'
    };
    return { 
      bg: 'from-cyber-red to-rose-700', 
      text: 'text-cyber-red', 
      glow: 'shadow-glow-red',
      ring: 'ring-cyber-red/20'
    };
  };
  
  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
    if (riskLevel === 'low') return <Shield className={iconSize} />;
    if (riskLevel === 'medium') return <AlertTriangle className={iconSize} />;
    if (riskLevel === 'high') return <AlertOctagon className={iconSize} />;
    return <Skull className={iconSize} />;
  };
  
  const getSizes = () => {
    if (size === 'sm') return { height: 'h-2', text: 'text-xs', icon: 'mb-3' };
    if (size === 'lg') return { height: 'h-6', text: 'text-base', icon: 'mb-8' };
    return { height: 'h-4', text: 'text-sm', icon: 'mb-6' };
  };
  
  const colors = getColor();
  const sizes = getSizes();
  
  return (
    <div className="relative">
      {showIcon && (
        <div className={`flex items-center justify-center ${sizes.icon}`}>
          <motion.div
            className={`${colors.text} relative`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            <motion.div
              className={`absolute inset-0 rounded-full ${colors.glow} blur-xl opacity-50`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {getIcon()}
          </motion.div>
        </div>
      )}
      
      <div className={`relative ${sizes.height} bg-gray-800/50 rounded-full overflow-hidden ring-1 ${colors.ring}`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.bg} ${colors.glow} shadow-lg relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
      
      <div className={`flex justify-between mt-2 ${sizes.text} text-gray-400`}>
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
