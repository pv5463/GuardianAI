'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Shield, AlertTriangle, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OverviewCardsProps {
  totalScans: number;
  highRiskPercentage: number;
  mostCommonScamType: string;
  estimatedLossPrevented: number;
}

export default function OverviewCards({
  totalScans,
  highRiskPercentage,
  mostCommonScamType,
  estimatedLossPrevented
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        title="Total Scans"
        value={totalScans}
        subtitle="Last 7 days"
        color="blue"
        delay={0}
      />
      <StatCard
        icon={<AlertTriangle className="w-6 h-6" />}
        title="High-Risk Scans"
        value={`${highRiskPercentage}%`}
        subtitle="Threats detected"
        color="red"
        delay={0.1}
      />
      <StatCard
        icon={<Shield className="w-6 h-6" />}
        title="Common Scam Type"
        value={mostCommonScamType}
        subtitle="Most frequent"
        color="purple"
        delay={0.2}
        isText
      />
      <StatCard
        icon={<DollarSign className="w-6 h-6" />}
        title="Loss Prevented"
        value={`₹${(estimatedLossPrevented / 1000).toFixed(0)}K`}
        subtitle="Estimated savings"
        color="green"
        delay={0.3}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'red' | 'purple' | 'green';
  delay: number;
  isText?: boolean;
}

function StatCard({ icon, title, value, subtitle, color, delay, isText }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(isText ? value : 0);

  useEffect(() => {
    if (isText) {
      setDisplayValue(value);
      return;
    }

    const numericValue = typeof value === 'string' ? 
      parseInt(value.replace(/[^0-9]/g, '')) : value;
    
    let start = 0;
    const duration = 2000;
    const increment = numericValue / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        if (typeof value === 'string' && value.includes('%')) {
          setDisplayValue(`${Math.floor(start)}%`);
        } else if (typeof value === 'string' && value.includes('₹')) {
          setDisplayValue(`₹${Math.floor(start / 1000)}K`);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isText]);

  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 shadow-blue-500/20',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 shadow-red-500/20',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 shadow-purple-500/20',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 shadow-green-500/20'
  };

  const iconColorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconColorClasses[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      <p className="text-white text-3xl font-bold mb-1">{displayValue}</p>
      <p className="text-gray-500 text-xs">{subtitle}</p>
    </motion.div>
  );
}
