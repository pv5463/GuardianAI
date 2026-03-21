'use client';

import { motion } from 'framer-motion';
import { 
  Home, Shield, AlertTriangle, Lock, User, 
  BarChart3, MessageSquare, Mic, Users, LogOut 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  userEmail?: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/threats', label: 'Threats', icon: Shield },
    { href: '/dashboard/voice-detector', label: 'Voice Detector', icon: Mic },
    { href: '/dashboard/incidents', label: 'Attack Response', icon: AlertTriangle },
    { href: '/dashboard/vault', label: 'Vault', icon: Lock },
    { href: '/dashboard/profile', label: 'Profile', icon: User }
  ];

  async function handleLogout() {
    await signOut();
    router.push('/');
  }

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0a0e27] to-[#060918] border-r border-white/5 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-xl flex items-center justify-center shadow-glow-blue">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <motion.div
              className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-xl opacity-20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">GuardianAI</h1>
            <p className="text-xs text-gray-400">Cybersecurity Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {userEmail && (
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
            <p className="text-sm text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all relative group ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 border border-cyber-blue/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyber-blue to-cyber-purple rounded-r"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyber-blue' : ''}`} />
                <span className="text-sm">{item.label}</span>
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyber-blue/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-white/5">
        <motion.button
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-400 hover:text-cyber-red hover:bg-cyber-red/10 transition-all w-full group"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
