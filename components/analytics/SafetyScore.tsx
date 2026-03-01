'use client';

import { motion } from 'framer-motion';
import { Shield, TrendingUp, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SafetyScoreProps {
  score: number;
  totalScans: number;
  reportsSubmitted: number;
  highRiskAvoided: number;
}

export default function SafetyScore({
  score,
  totalScans,
  reportsSubmitted,
  highRiskAvoided
}: SafetyScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = score / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">Your Digital Safety Score</h3>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="rgba(75, 85, 99, 0.3)"
              strokeWidth="12"
              fill="none"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{
                strokeDasharray: circumference
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={getScoreGradient(score).split(' ')[0].replace('from-', '')} />
                <stop offset="100%" className={getScoreGradient(score).split(' ')[1].replace('to-', '')} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${getScoreColor(displayScore)}`}>
              {displayScore}
            </span>
            <span className="text-gray-400 text-sm">/ 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-800/40 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalScans}</p>
          <p className="text-xs text-gray-400">Total Scans</p>
        </div>
        <div className="text-center p-3 bg-gray-800/40 rounded-lg">
          <Shield className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{highRiskAvoided}</p>
          <p className="text-xs text-gray-400">Threats Avoided</p>
        </div>
        <div className="text-center p-3 bg-gray-800/40 rounded-lg">
          <Award className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{reportsSubmitted}</p>
          <p className="text-xs text-gray-400">Reports</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          {score >= 80 && '🎉 Excellent! You\'re a cybersecurity champion!'}
          {score >= 60 && score < 80 && '👍 Good job! Keep scanning suspicious content.'}
          {score >= 40 && score < 60 && '📈 You\'re building good security habits!'}
          {score < 40 && '🚀 Start scanning more to improve your score!'}
        </p>
      </div>
    </motion.div>
  );
}
