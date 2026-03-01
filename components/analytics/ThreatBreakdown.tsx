'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, User, DollarSign, Code } from 'lucide-react';

interface ThreatBreakdownProps {
  urgencyScore: number;
  impersonationScore: number;
  financialScore: number;
  technicalScore: number;
}

export default function ThreatBreakdown({
  urgencyScore,
  impersonationScore,
  financialScore,
  technicalScore
}: ThreatBreakdownProps) {
  const threats = [
    {
      name: 'Urgency Pressure',
      score: urgencyScore,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'from-red-500 to-orange-500'
    },
    {
      name: 'Impersonation',
      score: impersonationScore,
      icon: <User className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Financial Pressure',
      score: financialScore,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Technical Manipulation',
      score: technicalScore,
      icon: <Code className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <h3 className="text-xl font-bold text-white mb-6">Threat Indicator Breakdown</h3>
      <div className="space-y-4">
        {threats.map((threat, index) => (
          <motion.div
            key={threat.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-gray-400">{threat.icon}</div>
                <span className="text-gray-300 font-medium">{threat.name}</span>
              </div>
              <span className="text-white font-bold">{threat.score}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${threat.score}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                className={`h-full bg-gradient-to-r ${threat.color} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
