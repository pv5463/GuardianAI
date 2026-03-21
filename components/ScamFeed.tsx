'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Radio } from 'lucide-react';
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
  const [newReportId, setNewReportId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchReports();
    
    const channel = supabase
      .channel('scam_reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scam_reports' }, (payload) => {
        const newReport = payload.new as ScamReport;
        setReports(prev => [newReport, ...prev].slice(0, 10));
        setNewReportId(newReport.id);
        setTimeout(() => setNewReportId(null), 3000);
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
    if (level === 'low') return { 
      text: 'text-cyber-green', 
      bg: 'bg-cyber-green/10',
      border: 'border-cyber-green/30'
    };
    if (level === 'medium') return { 
      text: 'text-cyber-yellow', 
      bg: 'bg-cyber-yellow/10',
      border: 'border-cyber-yellow/30'
    };
    if (level === 'high') return { 
      text: 'text-orange-400', 
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30'
    };
    return { 
      text: 'text-cyber-red', 
      bg: 'bg-cyber-red/10',
      border: 'border-cyber-red/30'
    };
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
      className="bg-gradient-to-br from-glass-light to-glass-medium backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-glass"
    >
      <div className="flex items-center gap-2 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <AlertTriangle className="w-5 h-5 text-cyber-red" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">Live Scam Feed</h3>
        <motion.span 
          className="ml-auto flex items-center gap-1 text-xs text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span 
            className="w-2 h-2 bg-cyber-green rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <Radio className="w-3 h-3" />
          Live
        </motion.span>
      </div>
      
      <div ref={scrollRef} className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {reports.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 text-center py-8"
            >
              No reports yet. Be the first to report!
            </motion.p>
          ) : (
            reports.map((report, index) => {
              const colors = getRiskColor(report.risk_level);
              const isNew = report.id === newReportId;
              
              return (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    boxShadow: isNew ? '0 0 20px rgba(0, 212, 255, 0.3)' : '0 0 0px rgba(0, 0, 0, 0)'
                  }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5, borderColor: 'rgba(0, 212, 255, 0.3)' }}
                  className={`p-4 bg-gradient-to-br from-glass-light to-transparent rounded-lg border ${
                    isNew ? 'border-cyber-blue/50' : 'border-white/10'
                  } transition-all relative overflow-hidden group`}
                >
                  {isNew && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyber-blue/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 1.5, repeat: 2 }}
                    />
                  )}
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.span 
                          className="text-xs font-semibold text-gray-300 uppercase"
                          whileHover={{ scale: 1.05 }}
                        >
                          {report.type}
                        </motion.span>
                        <motion.span 
                          className={`text-xs px-2 py-1 rounded-full border ${colors.text} ${colors.bg} ${colors.border}`}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {report.risk_level}
                        </motion.span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 group-hover:text-gray-300 transition-colors">
                        {report.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
