'use client';

import { motion } from 'framer-motion';
import { Brain, AlertCircle, Clock, Lock, Heart } from 'lucide-react';

interface PsychologicalTacticsProps {
  tactics: string[];
}

export default function PsychologicalTactics({ tactics }: PsychologicalTacticsProps) {
  const tacticIcons: Record<string, React.ReactNode> = {
    'Fear Manipulation': <AlertCircle className="w-4 h-4" />,
    'Authority Abuse': <Brain className="w-4 h-4" />,
    'Scarcity Pressure': <Clock className="w-4 h-4" />,
    'Confidentiality Request': <Lock className="w-4 h-4" />,
    'Emotional Exploitation': <Heart className="w-4 h-4" />
  };

  const tacticColors: Record<string, string> = {
    'Fear Manipulation': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Authority Abuse': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Scarcity Pressure': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Confidentiality Request': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Emotional Exploitation': 'bg-pink-500/20 text-pink-400 border-pink-500/30'
  };

  if (tactics.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-xl font-bold text-white">Psychological Tactics Detected</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {tactics.map((tactic, index) => (
          <motion.div
            key={tactic}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium ${tacticColors[tactic] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
          >
            {tacticIcons[tactic]}
            {tactic}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
