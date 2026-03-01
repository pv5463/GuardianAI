'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReportScamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportScamModal({ isOpen, onClose }: ReportScamModalProps) {
  const [scamType, setScamType] = useState('');
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scamTypes = ['UPI', 'Job', 'Bank', 'Deepfake Call', 'OTP', 'Phishing', 'Investment', 'Other'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scamType || !description || !riskLevel) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to report a scam');
        return;
      }

      const { error } = await supabase.from('community_reports').insert({
        user_id: user.id,
        scam_type: scamType,
        description: description,
        risk_level: riskLevel,
        location: location || null
      });

      if (error) throw error;

      setScamType('');
      setDescription('');
      setRiskLevel('');
      setLocation('');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Report a Scam</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scam Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={scamType}
                    onChange={(e) => setScamType(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select scam type</option>
                    {scamTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe the scam attempt..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Risk Level <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {riskLevels.map((level) => (
                      <motion.button
                        key={level}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRiskLevel(level)}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                          riskLevel === level
                            ? level === 'low' ? 'bg-green-500 text-white'
                            : level === 'medium' ? 'bg-yellow-500 text-white'
                            : level === 'high' ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                            : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
