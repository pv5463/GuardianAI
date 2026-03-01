'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, MapPin, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CommunityReport {
  id: string;
  scam_type: string;
  description: string;
  risk_level: string;
  location: string | null;
  created_at: string;
}

export default function CommunityFeed() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [count24h, setCount24h] = useState(0);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('community_reports')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'community_reports' },
        (payload) => {
          setReports(prev => [payload.new as CommunityReport, ...prev]);
          updateCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('community_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setReports(data);
      updateCount();
    }
  };

  const updateCount = async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('community_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo);

    if (count !== null) {
      setCount24h(count);
    }
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.scam_type.toLowerCase() === filter.toLowerCase());

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getScamTypeIcon = (type: string) => {
    return '🚨';
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Live Scam Alerts</h2>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg"
          >
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-semibold">{count24h} in 24h</span>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {['all', 'UPI', 'Job', 'Bank', 'Deepfake Call', 'OTP', 'Other'].map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filter === type
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </motion.button>
          ))}
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredReports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-400"
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No reports found</p>
              </motion.div>
            ) : (
              filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getScamTypeIcon(report.scam_type)}</span>
                      <div>
                        <h3 className="text-white font-semibold">{report.scam_type}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{timeAgo(report.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getRiskColor(report.risk_level)}`}>
                      {report.risk_level.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{report.description}</p>

                  {report.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{report.location}</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
