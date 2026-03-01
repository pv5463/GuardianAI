'use client';

import { motion } from 'framer-motion';
import { Shield, BarChart3, User, Home, AlertTriangle, FileText, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/threats', label: 'Threats', icon: Shield },
    { href: '/dashboard/incidents', label: 'Incidents', icon: AlertTriangle },
    { href: '/dashboard/vault', label: 'Vault', icon: Lock },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl animate-ping opacity-20"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                GuardianAI
              </h1>
              <p className="text-xs text-gray-400">Cybersecurity Platform</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all relative ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-lg"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="text-sm relative z-10">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lg:hidden flex gap-2 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'text-gray-400 bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
