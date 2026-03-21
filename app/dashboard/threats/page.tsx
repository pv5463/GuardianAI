'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Shield, Activity, TrendingUp, Clock,
  MapPin, Wifi, AlertCircle, CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

interface ThreatLog {
  id: string;
  threat_type: string;
  severity: string;
  source_ip: string;
  description: string;
  risk_score: number;
  indicators: string[];
  detected_at: string;
  status: string;
}

export default function ThreatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    active: 0
  });
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }
  
  useEffect(() => {
    if (user) {
      loadThreats();
    }
  }, [filter, user]);
  
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('threat_logs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'threat_logs'
      }, () => {
        loadThreats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadThreats = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      console.log('Loading threats with filter:', filter);
      
      // First, get all threats to calculate stats
      const { data: allThreats, error: allError } = await supabase
        .from('threat_logs')
        .select('*')
        .order('detected_at', { ascending: false });

      if (allError) {
        console.error('Error loading all threats:', allError);
        throw allError;
      }

      // Calculate stats from all threats
      if (allThreats) {
        setStats({
          total: allThreats.length,
          critical: allThreats.filter(t => t.severity === 'critical').length,
          high: allThreats.filter(t => t.severity === 'high').length,
          medium: allThreats.filter(t => t.severity === 'medium').length,
          low: allThreats.filter(t => t.severity === 'low').length,
          active: allThreats.filter(t => t.status === 'active').length
        });
      }

      // Then filter for display
      let displayThreats = allThreats || [];
      if (filter !== 'all') {
        displayThreats = displayThreats.filter(t => t.severity === filter);
      }
      
      // Limit to 50 for display
      displayThreats = displayThreats.slice(0, 50);
      
      console.log('Threats loaded:', displayThreats.length, 'displayed,', allThreats?.length || 0, 'total');
      setThreats(displayThreats);
      setError('');
    } catch (error: any) {
      console.error('Error loading threats:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      
      // Provide helpful error message based on error type
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        setError('Database tables not found. Please run the migration script in Supabase SQL Editor.');
      } else if (error.message?.includes('permission')) {
        setError('Permission denied. Please check your user role and database policies.');
      } else {
        setError(`Failed to load threats: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5" />;
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Activity className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'investigating': return <Activity className="w-4 h-4 text-yellow-400" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'false_positive': return <XCircle className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#060918] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#060918] relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <Sidebar userEmail={user?.email} />
      <TopBar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Shield className="w-10 h-10 text-cyber-blue" />
                <div className="absolute inset-0 w-10 h-10 text-cyber-blue animate-ping opacity-20">
                  <Shield className="w-10 h-10" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white">Threat Monitor</h1>
            </div>
            <p className="text-gray-400">Real-time threat detection and analysis</p>
          </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, color: 'from-cyber-blue to-cyan-500', icon: Activity },
              { label: 'Critical', value: stats.critical, color: 'from-cyber-red to-red-600', icon: AlertCircle },
              { label: 'High', value: stats.high, color: 'from-orange-500 to-orange-600', icon: AlertTriangle },
              { label: 'Medium', value: stats.medium, color: 'from-cyber-yellow to-yellow-600', icon: Activity },
              { label: 'Low', value: stats.low, color: 'from-cyber-green to-green-600', icon: Shield },
              { label: 'Active', value: stats.active, color: 'from-cyber-purple to-purple-600', icon: TrendingUp }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyber-blue/50 transition-all"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilter(severity)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === severity
                    ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-glow-blue'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>

          {/* Threats List */}
          <AnimatePresence mode="popLayout">
            {threats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No threats detected</p>
                <p className="text-gray-500 text-sm">Your system is secure</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {threats.map((threat, index) => (
                  <motion.div
                    key={threat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyber-blue/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getSeverityColor(threat.severity)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          {getSeverityIcon(threat.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {threat.threat_type.replace(/_/g, ' ').toUpperCase()}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              threat.severity === 'critical' ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30' :
                              threat.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              threat.severity === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30' :
                              'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                            }`}>
                              {threat.severity.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(threat.status)}
                              <span className="text-xs text-gray-400 capitalize">{threat.status}</span>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-3">{threat.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Wifi className="w-4 h-4" />
                              <span>{threat.source_ip}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(threat.detected_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>Risk: {threat.risk_score}/100</span>
                            </div>
                          </div>

                          {threat.indicators && threat.indicators.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {threat.indicators.map((indicator, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-cyber-red/10 border border-cyber-red/30 rounded text-xs text-cyber-red"
                                >
                                  {indicator}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-1">{threat.risk_score}</div>
                        <div className="text-xs text-gray-400">Risk Score</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
