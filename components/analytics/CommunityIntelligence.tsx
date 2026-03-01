'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCommunityIntelligence } from '@/lib/metricsEngine';

export default function CommunityIntelligence() {
  const [data, setData] = useState({
    trendingScamType: 'Loading...',
    totalReports: 0,
    highRiskPercentage: 0,
    isHighAlert: false
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const intelligence = await getCommunityIntelligence();
    setData(intelligence);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Community Intelligence</h3>
        </div>
        {data.isHighAlert && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-semibold">HIGH ALERT</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Trending Today</span>
          </div>
          <p className="text-white text-xl font-bold">{data.trendingScamType}</p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Reports (24h)</span>
          </div>
          <p className="text-white text-xl font-bold">{data.totalReports}</p>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-gray-400 text-sm">High Risk %</span>
          </div>
          <p className="text-white text-xl font-bold">{data.highRiskPercentage}%</p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-800/40 rounded-lg">
        <p className="text-gray-300 text-sm">
          {data.isHighAlert 
            ? '⚠️ High scam activity detected in the community. Exercise extra caution.'
            : '✓ Normal scam activity levels. Stay vigilant.'}
        </p>
      </div>
    </motion.div>
  );
}
