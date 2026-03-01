'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ScamReport {
  id: string;
  type: string;
  description: string;
  risk_level: string;
  created_at: string;
}

export default function ScamFeed() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchReports();
    
    const channel = supabase
      .channel('scam_reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scam_reports' }, (payload) => {
        setReports(prev => [payload.new as ScamReport, ...prev].slice(0, 10));
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('scam_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const getRiskColor = (level: string) => {
    if (level === 'low') return 'text-green-400 bg-green-500/10';
    if (level === 'medium') return 'text-yellow-400 bg-yellow-500/10';
    if (level === 'high') return 'text-orange-400 bg-orange-500/10';
    return 'text-red-400 bg-red-500/10';
  };
  
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h3 className="text-xl font-bold text-white">Live Scam Feed</h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {reports.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No reports yet. Be the first to report!</p>
        ) : (
          reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-300 uppercase">{report.type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(report.risk_level)}`}>
                      {report.risk_level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{report.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
