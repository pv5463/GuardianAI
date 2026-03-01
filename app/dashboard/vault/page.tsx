'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Plus, Trash2, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/encryption';

interface EncryptedNote {
  id: string;
  title: string;
  encrypted_content: string;
  iv: string;
  created_at: string;
  updated_at: string;
}

export default function VaultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<EncryptedNote[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<EncryptedNote | null>(null);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [password, setPassword] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('encrypted_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotes(data);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle || !newContent || !newPassword) {
      setError('All fields are required');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { encryptedContent, iv } = await encryptData(newContent, newPassword);

      await supabase.from('encrypted_notes').insert({
        user_id: user.id,
        title: newTitle,
        encrypted_content: encryptedContent,
        iv: iv
      });

      setNewTitle('');
      setNewContent('');
      setNewPassword('');
      setShowCreateModal(false);
      await loadNotes();
    } catch (error) {
      setError('Failed to create note');
    } finally {
      setProcessing(false);
    }
  };

  const handleView = async () => {
    if (!selectedNote || !password) {
      setError('Password is required');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const decrypted = await decryptData(
        selectedNote.encrypted_content,
        selectedNote.iv,
        password
      );
      setDecryptedContent(decrypted);
      setPassword('');
    } catch (error) {
      setError('Incorrect password or corrupted data');
      setDecryptedContent('');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    await supabase.from('encrypted_notes').delete().eq('id', noteId);
    await loadNotes();
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
      <div className="max-w-6xl mx-auto">
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-10 h-10 text-blue-500" />
                <h1 className="text-4xl font-bold text-white">Encrypted Vault</h1>
              </div>
              <p className="text-gray-400">Secure storage with AES-256 encryption</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Note
            </button>
          </div>
        </motion.div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Your vault is empty</p>
            <p className="text-gray-500 text-sm">Create your first encrypted note</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{note.title}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Created {new Date(note.created_at).toLocaleDateString()}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Shield className="w-4 h-4" />
                  <span>AES-256 Encrypted</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedNote(note);
                    setShowViewModal(true);
                    setDecryptedContent('');
                    setPassword('');
                    setError('');
                  }}
                  className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Note
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Create Encrypted Note</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Enter note title"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Content</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Enter sensitive information"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Encryption Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Enter a strong password"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Remember this password - it cannot be recovered
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreate}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Create Encrypted Note
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Modal */}
        <AnimatePresence>
          {showViewModal && selectedNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full"
              >
                <h2 className="text-2xl font-bold text-white mb-6">{selectedNote.title}</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {!decryptedContent ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Enter Password to Decrypt</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleView()}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter password"
                        autoFocus
                      />
                    </div>

                    <button
                      onClick={handleView}
                      disabled={processing}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Decrypting...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-5 h-5" />
                          Decrypt Note
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        Successfully decrypted
                      </p>
                    </div>
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <p className="text-gray-300 whitespace-pre-wrap">{decryptedContent}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setDecryptedContent('');
                    setPassword('');
                  }}
                  className="w-full mt-4 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
