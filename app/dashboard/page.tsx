'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Link as LinkIcon, Image, Mic, Users, Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { analyzeText, analyzeURL, type ScamAnalysisResult } from '@/lib/scamDetectionIntegrated';
import { analyzeUPI } from '@/lib/scamDetection';
import AnalysisCard from '@/components/AnalysisCard';
import ScamFeed from '@/components/ScamFeed';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ActionPanel from '@/components/ActionPanel';
import VoiceDeepfakeAnalyzer from '@/components/VoiceDeepfakeAnalyzer';
import CommunityFeed from '@/components/CommunityFeed';
import ReportScamModal from '@/components/ReportScamModal';
import DeepfakeImageAnalyzer from '@/components/DeepfakeImageAnalyzer';
import ThreatBreakdown from '@/components/analytics/ThreatBreakdown';
import PsychologicalTactics from '@/components/analytics/PsychologicalTactics';
import URLIntelligence from '@/components/analytics/URLIntelligence';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { calculateThreatBreakdown, extractPsychologicalTactics } from '@/lib/metricsEngine';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'analyzer' | 'community'>('analyzer');
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'deepfake'>('text');
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
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
  
  async function handleAnalyze() {
    if (!inputText.trim()) return;
    
    setAnalyzing(true);
    setResult(null);
    setThreatBreakdown(null);
    
    let analysisResult: ScamAnalysisResult;
    
    try {
      if (activeTab === 'text') {
        analysisResult = await analyzeText(inputText, user?.id);
      } else if (activeTab === 'url') {
        if (inputText.includes('@') && !inputText.includes('http')) {
          analysisResult = analyzeUPI(inputText);
        } else {
          analysisResult = await analyzeURL(inputText, user?.id);
        }
      } else {
        analysisResult = await analyzeText(inputText, user?.id);
      }
      
      const breakdown = calculateThreatBreakdown(inputText);
      setThreatBreakdown(breakdown);
      
      setResult(analysisResult);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }
  
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
          {/* Section Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mb-6"
          >
            {[
              { id: 'analyzer', label: 'Text & URL Analyzer', icon: MessageSquare },
              { id: 'community', label: 'Community Alerts', icon: Users }
            ].map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-glow-blue'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-cyber-blue/30'
                }`}
              >
                <section.icon className="w-5 h-5" />
                {section.label}
              </motion.button>
            ))}
          </motion.div>
        
          {activeSection === 'analyzer' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
                >
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink bg-clip-text text-transparent mb-6">
                    Analyze Suspicious Content
                  </h2>
                  
                  <div className="flex gap-2 mb-6">
                    {[
                      { id: 'text', label: 'Text & Message', icon: MessageSquare },
                      { id: 'url', label: 'URL & UPI', icon: LinkIcon },
                      { id: 'deepfake', label: 'Deepfake Image', icon: Image }
                    ].map((tab, index) => (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setResult(null);
                          setInputText('');
                          setThreatBreakdown(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-glow-blue'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </motion.button>
                    ))}
                  </div>
                  
                  {activeTab === 'deepfake' ? (
                    user && <DeepfakeImageAnalyzer userId={user.id} />
                  ) : (
                    <div className="space-y-4">
                      <div className="relative group">
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={
                            activeTab === 'text'
                              ? 'Paste suspicious SMS, email, or WhatsApp message here...\n\nFor emails, use format:\nSubject: Your subject here\n\nEmail body here...'
                              : 'Enter suspicious URL or UPI ID...'
                          }
                          className="w-full h-40 px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all resize-none"
                        />
                        <motion.div
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          animate={{
                            boxShadow: inputText.trim() 
                              ? '0 0 20px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.05)' 
                              : '0 0 0px rgba(0, 212, 255, 0)'
                          }}
                          transition={{ duration: 0.3 }}
                        />
                        
                        <motion.div
                          className="absolute -inset-0.5 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity -z-10"
                        />
                      </div>
                      
                      {activeTab === 'text' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-gray-400 flex items-center gap-2"
                        >
                          <div className="w-1 h-1 bg-cyber-blue rounded-full" />
                          💡 Tip: For email analysis, start with "Subject:" followed by the email body
                        </motion.div>
                      )}
                      
                      <motion.button
                        whileHover={{ 
                          scale: 1.02, 
                          boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)' 
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnalyze}
                        disabled={analyzing || !inputText.trim()}
                        className="w-full py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-semibold rounded-xl shadow-glow-blue hover:shadow-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: analyzing ? ['-100%', '200%'] : '-100%' }}
                          transition={{ duration: 1.5, repeat: analyzing ? Infinity : 0, ease: 'linear' }}
                        />
                        
                        {analyzing && (
                          <motion.div
                            className="absolute inset-0 bg-cyber-blue/20"
                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                        
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {analyzing ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              Analyzing...
                            </>
                          ) : (
                            'Analyze Now'
                          )}
                        </span>
                      </motion.button>
                    </div>
                  )}
                </motion.div>
                
                {activeTab !== 'deepfake' && (
                  <>
                    {analyzing && <LoadingSkeleton />}
                    {result && !analyzing && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 50, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 100,
                            damping: 15
                          }}
                        >
                          <AnalysisCard
                            result={result}
                            title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis Results`}
                          />
                        </motion.div>
                        {threatBreakdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <ThreatBreakdown
                              urgencyScore={threatBreakdown.urgencyScore}
                              impersonationScore={threatBreakdown.impersonationScore}
                              financialScore={threatBreakdown.financialScore}
                              technicalScore={threatBreakdown.technicalScore}
                            />
                          </motion.div>
                        )}
                        {result.detectedIndicators && result.detectedIndicators.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <PsychologicalTactics 
                              tactics={extractPsychologicalTactics(result.redFlags)} 
                            />
                          </motion.div>
                        )}
                        {activeTab === 'url' && !inputText.includes('@') && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <URLIntelligence url={inputText} />
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <ActionPanel riskLevel={result.riskLevel} />
                        </motion.div>
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

          {activeSection === 'community' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CommunityFeed />
              </div>
              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full py-4 bg-gradient-to-r from-cyber-red to-pink-600 text-white font-semibold rounded-xl shadow-glow-red hover:shadow-glow-pink transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Report a Scam
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ReportScamModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />
    </div>
  );
}
