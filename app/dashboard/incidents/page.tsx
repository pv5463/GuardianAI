'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, Clock, User, FileText,
  ChevronDown, ChevronUp, Shield, ArrowLeft
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getIncidents, updateIncidentStatus, getIncidentStats } from '@/lib/incidentResponse';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  mitigation_steps: string[];
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  threat_logs: any;
  user_profiles: any;
}

export default function IncidentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      console.log('Loading incidents with filter:', filter);
      
      const statusFilter = filter === 'all' ? undefined : filter;
      const [incidentsData, statsData] = await Promise.all([
        getIncidents(statusFilter),
        getIncidentStats()
      ]);

      console.log('Incidents loaded:', incidentsData?.length || 0);
      console.log('Stats loaded:', statsData);

      setIncidents(incidentsData || []);
      setStats(statsData);
      setError(''); // Clear any previous errors
    } catch (error: any) {
      console.error('Error loading incidents:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      
      // Provide helpful error message based on error type
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        setError('Database tables not found. Please run the migration script in Supabase SQL Editor.');
      } else if (error.message?.includes('permission')) {
        setError('Permission denied. Please check your user role and database policies.');
      } else {
        setError(`Failed to load incidents: ${error.message || 'Unknown error'}. Check browser console for details.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    setResolving(incidentId);
    try {
      await updateIncidentStatus(incidentId, 'resolved', 'Incident resolved by user action');
      await loadData();
    } catch (error) {
      console.error('Error resolving incident:', error);
    } finally {
      setResolving(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500/20 text-red-400';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </motion.button>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl font-bold text-white">Incident Response</h1>
          </div>
          <p className="text-gray-400">Automated incident management and resolution</p>
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

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500' },
              { label: 'Open', value: stats.open, color: 'from-red-500 to-red-600' },
              { label: 'Investigating', value: stats.investigating, color: 'from-yellow-500 to-yellow-600' },
              { label: 'Resolved', value: stats.resolved, color: 'from-green-500 to-green-600' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4"
              >
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'open', 'investigating', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Incidents List */}
        <AnimatePresence mode="popLayout">
          {incidents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No incidents found</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">{incident.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                            {incident.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">{incident.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(incident.created_at).toLocaleString()}</span>
                          </div>
                          {incident.threat_logs && (
                            <div className="flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              <span>Threat: {incident.threat_logs.threat_type}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        {expandedId === incident.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedId === incident.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-700/50 pt-4 mt-4"
                        >
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Mitigation Steps
                          </h4>
                          <ul className="space-y-2 mb-4">
                            {incident.mitigation_steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>

                          {incident.status !== 'resolved' && incident.status !== 'closed' && (
                            <button
                              onClick={() => handleResolve(incident.id)}
                              disabled={resolving === incident.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {resolving === incident.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Resolving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Mark as Resolved
                                </>
                              )}
                            </button>
                          )}

                          {incident.resolution_notes && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <p className="text-sm text-green-400">
                                <strong>Resolution:</strong> {incident.resolution_notes}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
