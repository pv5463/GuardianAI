'use client';

import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';

interface AIExplanationPanelProps {
  title?: string;
  reasons: string[];
  variant?: 'primary' | 'danger' | 'warning' | 'success';
}

export default function AIExplanationPanel({ 
  title = '🧠 Why this is risky',
  reasons,
  variant = 'primary'
}: AIExplanationPanelProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'from-cyber-red/10 to-pink-500/10',
          border: 'border-cyber-red/30',
          icon: 'text-cyber-red',
          bullet: 'bg-cyber-red'
        };
      case 'warning':
        return {
          bg: 'from-cyber-yellow/10 to-orange-500/10',
          border: 'border-cyber-yellow/30',
          icon: 'text-cyber-yellow',
          bullet: 'bg-cyber-yellow'
        };
      case 'success':
        return {
          bg: 'from-cyber-green/10 to-emerald-500/10',
          border: 'border-cyber-green/30',
          icon: 'text-cyber-green',
          bullet: 'bg-cyber-green'
        };
      default:
        return {
          bg: 'from-cyber-blue/10 to-cyber-purple/10',
          border: 'border-cyber-blue/30',
          icon: 'text-cyber-blue',
          bullet: 'bg-cyber-blue'
        };
    }
  };
  
  const styles = getVariantStyles();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br ${styles.bg} border ${styles.border} rounded-xl p-5 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className={`w-5 h-5 ${styles.icon}`} />
        </motion.div>
        <h3 className="font-semibold text-white">{title}</h3>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Zap className={`w-4 h-4 ${styles.icon} ml-auto`} />
        </motion.div>
      </div>
      
      <div className="space-y-3">
        {reasons.map((reason, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 group"
          >
            <motion.div
              className={`w-2 h-2 ${styles.bullet} rounded-full mt-2 flex-shrink-0`}
              whileHover={{ scale: 1.5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">
              {reason}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
