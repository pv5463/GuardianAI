/**
 * Custom hook for real-time user data management
 * Automatically fetches and subscribes to user-specific data
 */

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import {
  getUserThreats,
  getUserAnalysisHistory,
  getUserIncidents,
  subscribeToUserThreats,
  subscribeToUserIncidents,
} from './aiEngineClient';

export interface UserDataState {
  threats: any[];
  analysisHistory: any[];
  incidents: any[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage user-specific threat data with real-time updates
 */
export function useUserThreats(userId: string | null) {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setThreats([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchThreats = async () => {
      try {
        setLoading(true);
        const data = await getUserThreats(userId);
        setThreats(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching threats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchThreats();

    // Subscribe to real-time updates
    const channel = subscribeToUserThreats(userId, (payload) => {
      console.log('Threat update:', payload);
      
      if (payload.eventType === 'INSERT') {
        setThreats(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setThreats(prev =>
          prev.map(t => (t.id === payload.new.id ? payload.new : t))
        );
      } else if (payload.eventType === 'DELETE') {
        setThreats(prev => prev.filter(t => t.id !== payload.old.id));
      }
    });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { threats, loading, error, refetch: () => getUserThreats(userId!) };
}

/**
 * Hook to manage user-specific analysis history with real-time updates
 */
export function useUserAnalysisHistory(userId: string | null) {
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAnalysisHistory([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getUserAnalysisHistory(userId);
        setAnalysisHistory(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching analysis history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_analysis_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phishing_analysis',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Analysis update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setAnalysisHistory(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAnalysisHistory(prev =>
              prev.map(a => (a.id === payload.new.id ? payload.new : a))
            );
          } else if (payload.eventType === 'DELETE') {
            setAnalysisHistory(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { analysisHistory, loading, error, refetch: () => getUserAnalysisHistory(userId!) };
}

/**
 * Hook to manage user-specific incidents with real-time updates
 */
export function useUserIncidents(userId: string | null, status?: string) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const data = await getUserIncidents(userId, status);
        setIncidents(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching incidents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    // Subscribe to real-time updates
    const channel = subscribeToUserIncidents(userId, (payload) => {
      console.log('Incident update:', payload);
      
      if (payload.eventType === 'INSERT') {
        setIncidents(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setIncidents(prev =>
          prev.map(i => (i.id === payload.new.id ? payload.new : i))
        );
      } else if (payload.eventType === 'DELETE') {
        setIncidents(prev => prev.filter(i => i.id !== payload.old.id));
      }
    });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, status]);

  return { incidents, loading, error, refetch: () => getUserIncidents(userId!, status) };
}

/**
 * Hook to manage all user data at once
 */
export function useUserData(userId: string | null): UserDataState {
  const { threats, loading: threatsLoading, error: threatsError } = useUserThreats(userId);
  const { analysisHistory, loading: analysisLoading, error: analysisError } = useUserAnalysisHistory(userId);
  const { incidents, loading: incidentsLoading, error: incidentsError } = useUserIncidents(userId);

  return {
    threats,
    analysisHistory,
    incidents,
    loading: threatsLoading || analysisLoading || incidentsLoading,
    error: threatsError || analysisError || incidentsError,
  };
}

/**
 * Hook to get user stats
 */
export function useUserStats(userId: string | null) {
  const { threats, analysisHistory, incidents } = useUserData(userId);

  const stats = {
    totalThreats: threats.length,
    criticalThreats: threats.filter(t => t.severity === 'critical').length,
    highThreats: threats.filter(t => t.severity === 'high').length,
    totalAnalyses: analysisHistory.length,
    scamsDetected: analysisHistory.filter(a => a.is_scam).length,
    openIncidents: incidents.filter(i => i.status === 'open').length,
    resolvedIncidents: incidents.filter(i => i.status === 'resolved').length,
  };

  return stats;
}
