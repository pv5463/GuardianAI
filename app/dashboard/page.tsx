'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, MessageSquare, Link as LinkIcon, Image, LogOut, Menu, X, Mic, Users, Plus } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { analyzeText, analyzeURL, analyzeUPI } from '@/lib/scamDetection';
import AnalysisCard from '@/components/AnalysisCard';
import ScamFeed from '@/components/ScamFeed';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ActionPanel from '@/components/ActionPanel';
import VoiceAnalyzer from '@/components/VoiceAnalyzer';
import CommunityFeed from '@/components/CommunityFeed';
import ReportScamModal from '@/components/ReportScamModal';
import DashboardNav from '@/components/DashboardNav';
import ScreenshotAnalyzer from '@/components/ScreenshotAnalyzer';
import ThreatBreakdown from '@/components/analytics/ThreatBreakdown';
import PsychologicalTactics from '@/components/analytics/PsychologicalTactics';
import URLIntelligence from '@/components/analytics/URLIntelligence';
import { saveScanToDatabase, calculateThreatBreakdown, extractPsychologicalTactics } from '@/lib/metricsEngine';
import type { ScamAnalysisResult } from '@/lib/scamDetection';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'analyzer' | 'voice' | 'community'>('analyzer');
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'screenshot'>('text');
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [threatBreakdown, setThreatBreakdown] = useState<any>(null);
  
  useEffect(() => {
    checkUser();
  }, []);
  
  async function checkUser() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }
  
  async function handleLogout() {
    await signOut();
    router.push('/');
  }
  
  async function handleAnalyze() {
    if (!inputText.trim()) return;
    
    setAnalyzing(true);
    setResult(null);
    setThreatBreakdown(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let analysisResult: ScamAnalysisResult;
    
    if (activeTab === 'text') {
      analysisResult = analyzeText(inputText);
    } else if (activeTab === 'url') {
      if (inputText.includes('@') && !inputText.includes('http')) {
        analysisResult = analyzeUPI(inputText);
      } else {
        analysisResult = analyzeURL(inputText);
      }
    } else {
      analysisResult = analyzeText(inputText);
    }
    
    const breakdown = calculateThreatBreakdown(inputText);
    setThreatBreakdown(breakdown);
    
    if (user) {
      await saveScanToDatabase(user.id, activeTab, inputText, analysisResult);
    }
    
    setResult(analysisResult);
    setAnalyzing(false);
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <DashboardNav />
      
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{user?.email}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-gray-800"
            >
              <div className="flex flex-col gap-3">
                <span className="text-sm text-gray-400">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'analyzer', label: 'Text & URL Analyzer', icon: MessageSquare },
            { id: 'voice', label: 'Voice Scam Analyzer', icon: Mic },
            { id: 'community', label: 'Community Alerts', icon: Users }
          ].map((section) => (
            <motion.button
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700/50'
              }`}
            >
              <section.icon className="w-5 h-5" />
              {section.label}
            </motion.button>
          ))}
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeSection === 'analyzer' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Analyze Suspicious Content</h2>
                
                <div className="flex gap-2 mb-6 overflow-x-auto">
                  {[
                    { id: 'text', label: 'Text & Message', icon: MessageSquare },
                    { id: 'url', label: 'URL & UPI', icon: LinkIcon },
                    { id: 'screenshot', label: 'Screenshot', icon: Image }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setResult(null);
                        setInputText('');
                        setThreatBreakdown(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>
                
                {activeTab === 'screenshot' ? (
                  user && <ScreenshotAnalyzer userId={user.id} />
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        activeTab === 'text'
                          ? 'Paste suspicious SMS, email, or WhatsApp message here...'
                          : 'Enter suspicious URL or UPI ID...'
                      }
                      className="w-full h-40 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      disabled={analyzing || !inputText.trim()}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze Now'}
                    </motion.button>
                  </div>
                )}
              </motion.div>
              
              {activeTab !== 'screenshot' && (
                <>
                  {analyzing && <LoadingSkeleton />}
                  {result && !analyzing && (
                    <>
                      <AnalysisCard
                        result={result}
                        title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis Results`}
                      />
                      {threatBreakdown && (
                        <ThreatBreakdown
                          urgencyScore={threatBreakdown.urgencyScore}
                          impersonationScore={threatBreakdown.impersonationScore}
                          financialScore={threatBreakdown.financialScore}
                          technicalScore={threatBreakdown.technicalScore}
                        />
                      )}
                      {result.detectedIndicators && result.detectedIndicators.length > 0 && (
                        <PsychologicalTactics 
                          tactics={extractPsychologicalTactics(result.redFlags)} 
                        />
                      )}
                      {activeTab === 'url' && !inputText.includes('@') && (
                        <URLIntelligence url={inputText} />
                      )}
                      <ActionPanel riskLevel={result.riskLevel} />
                    </>
                  )}
                </>
              )}
            </div>
            
            <div className="space-y-6">
              <ScamFeed />
            </div>
          </div>
        )}

        {activeSection === 'voice' && (
          <VoiceAnalyzer />
        )}

        {activeSection === 'community' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CommunityFeed />
            </div>
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/50 hover:shadow-red-500/70 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Report a Scam
              </motion.button>
            </div>
          </div>
        )}
      </main>

      <ReportScamModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />
    </div>
  );
}
