'use client';

import { motion } from 'framer-motion';

interface PasswordStrengthIndicatorProps {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export default function PasswordStrengthIndicator({ strength, score }: PasswordStrengthIndicatorProps) {
  const getColor = () => {
    if (strength === 'weak') return 'bg-red-500';
    if (strength === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getTextColor = () => {
    if (strength === 'weak') return 'text-red-400';
    if (strength === 'medium') return 'text-yellow-400';
    return 'text-green-400';
  };
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${getTextColor()}`}>
          Password Strength: {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </span>
        <span className="text-sm text-gray-400">{score}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
