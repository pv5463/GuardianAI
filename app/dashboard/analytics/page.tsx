'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import {
  getAnalyticsOverview,
  getScamTypeDistribution,
  getRiskTrendData,
  getUserSafetyScore
} from '@/lib/metricsEngine';
import OverviewCards from '@/components/analytics/OverviewCards';
import ScamTypeChart from '@/components/charts/ScamTypeChart';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import SafetyScore from '@/components/analytics/SafetyScore';
import CommunityIntelligence from '@/components/analytics/CommunityIntelligence';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalScans: 0,
    highRiskPercentage: 0,
    mostCommonScamType: 'None',
    estimatedLossPrevented: 0
  });
  const [scamTypes, setScamTypes] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [safetyScore, setSafetyScore] = useState({
    score: 0,
    totalScans: 0,
    reportsSubmitted: 0,
    highRiskAvoided: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const [overviewData, scamTypeData, trendDataResult, safetyScoreData] = await Promise.all([
        getAnalyticsOverview(user.id),
        getScamTypeDistribution(user.id),
        getRiskTrendData(user.id),
        getUserSafetyScore(user.id)
      ]);

      setOverview(overviewData);
      setScamTypes(scamTypeData);
      setTrendData(trendDataResult);
      setSafetyScore(safetyScoreData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-4xl font-bold text-white mb-2">Analytics & Intelligence</h1>
          <p className="text-gray-400">Comprehensive insights into your scam detection activity</p>
        </motion.div>

        <OverviewCards
          totalScans={overview.totalScans}
          highRiskPercentage={overview.highRiskPercentage}
          mostCommonScamType={overview.mostCommonScamType}
          estimatedLossPrevented={overview.estimatedLossPrevented}
        />

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <ScamTypeChart data={scamTypes} />
          <RiskTrendChart data={trendData} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <SafetyScore
            score={safetyScore.score}
            totalScans={safetyScore.totalScans}
            reportsSubmitted={safetyScore.reportsSubmitted}
            highRiskAvoided={safetyScore.highRiskAvoided}
          />
          <CommunityIntelligence />
        </div>
      </div>
    </div>
  );
}
