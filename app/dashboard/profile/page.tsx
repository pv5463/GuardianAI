'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, LogOut, Award, ArrowLeft } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getUserSafetyScore } from '@/lib/metricsEngine';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [safetyScore, setSafetyScore] = useState({
    score: 0,
    totalScans: 0,
    reportsSubmitted: 0,
    highRiskAvoided: 0
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    const scoreData = await getUserSafetyScore(currentUser.id);
    setSafetyScore(scoreData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
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
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account and view your activity</p>
        </motion.div>

        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {user?.user_metadata?.full_name || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Safety Score</span>
                </div>
                <p className="text-white text-3xl font-bold">{safetyScore.score}</p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Total Scans</span>
                </div>
                <p className="text-white text-3xl font-bold">{safetyScore.totalScans}</p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Threats Avoided</span>
                </div>
                <p className="text-white text-3xl font-bold">{safetyScore.highRiskAvoided}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-800/40 rounded-lg">
                <span className="text-gray-400">Email</span>
                <span className="text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-800/40 rounded-lg">
                <span className="text-gray-400">Account Status</span>
                <span className="text-green-400 font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-800/40 rounded-lg">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white font-medium">
                  {new Date(user?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
