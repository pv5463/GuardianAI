'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Shield, AlertOctagon, CheckCircle, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ThreatCardProps {
  title: string;
  description?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  icon?: LucideIcon;
  children?: ReactNode;
  onClick?: () => void;
}

export default function ThreatCard({ 
  title, 
  description, 
  riskLevel, 
  icon: CustomIcon,
  children,
  onClick 
}: ThreatCardProps) {
  const getStyles = () => {
    switch (riskLevel) {
      case 'low':
        return {
          bg: 'bg-cyber-green/20',
          border: 'border-cyber-green/30',
          text: 'text-cyber-green',
          glow: 'shadow-glow-green',
          icon: Shield
        };
      case 'medium':
        return {
          bg: 'bg-cyber-yellow/20',
          border: 'border-cyber-yellow/30',
          text: 'text-cyber-yellow',
          glow: 'shadow-glow-yellow',
          icon: AlertTriangle
        };
      case 'high':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          glow: 'shadow-glow-red',
          icon: AlertOctagon
        };
      case 'critical':
        return {
          bg: 'bg-cyber-red/20',
          border: 'border-cyber-red/30',
          text: 'text-cyber-red',
          glow: 'shadow-glow-red',
          icon: AlertOctagon
        };
    }
  };
  
  const styles = getStyles();
  const Icon = CustomIcon || styles.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' }}
      onClick={onClick}
      className={`bg-gradient-to-br from-glass-light to-transparent backdrop-blur-xl border ${styles.border} rounded-xl p-5 ${styles.glow} transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className={`p-3 rounded-lg ${styles.bg} ${styles.border} border`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
