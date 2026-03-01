'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Phone, Shield, FileText, ExternalLink, LucideIcon } from 'lucide-react';

interface ActionPanelProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Action {
  icon: LucideIcon;
  label: string;
  description: string;
  link: string;
  external?: boolean;
  urgent?: boolean;
}

export default function ActionPanel({ riskLevel }: ActionPanelProps) {
  const actions: Record<'low' | 'medium' | 'high' | 'critical', Action[]> = {
    low: [
      { icon: Shield, label: 'Stay Vigilant', description: 'Continue monitoring for suspicious activity', link: '#' },
      { icon: FileText, label: 'Learn More', description: 'Read about common scam tactics', link: '#' }
    ],
    medium: [
      { icon: AlertTriangle, label: 'Verify Sender', description: 'Contact organization through official channels', link: '#' },
      { icon: Shield, label: 'Block Sender', description: 'Prevent future messages from this source', link: '#' },
      { icon: FileText, label: 'Report Suspicious Activity', description: 'Help protect others', link: '#' }
    ],
    high: [
      { icon: Phone, label: 'Contact Bank', description: 'Call your bank immediately if financial info was shared', link: '#' },
      { icon: AlertTriangle, label: 'Report to Cybercrime', description: 'File a complaint at cybercrime.gov.in', link: 'https://cybercrime.gov.in', external: true },
      { icon: Shield, label: 'Change Passwords', description: 'Update all affected account passwords', link: '#' },
      { icon: FileText, label: 'Document Evidence', description: 'Save all messages and screenshots', link: '#' }
    ],
    critical: [
      { icon: Phone, label: 'Emergency: Call Bank', description: 'Freeze accounts immediately - Call 1800-XXX-XXXX', link: '#', urgent: true },
      { icon: AlertTriangle, label: 'Report to Cybercrime NOW', description: 'File immediate complaint at cybercrime.gov.in', link: 'https://cybercrime.gov.in', external: true, urgent: true },
      { icon: Shield, label: 'Change All Passwords', description: 'Update passwords for all financial accounts', link: '#', urgent: true },
      { icon: FileText, label: 'Monitor Bank Statements', description: 'Check for unauthorized transactions', link: '#' },
      { icon: Phone, label: 'Contact Credit Bureau', description: 'Place fraud alert on your credit report', link: '#' }
    ]
  };
  
  const currentActions = actions[riskLevel];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className={`w-5 h-5 ${riskLevel === 'critical' || riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
        <h3 className="text-xl font-bold text-white">Immediate Actions Required</h3>
      </div>
      
      <div className="space-y-3">
        {currentActions.map((action, index) => (
          <motion.a
            key={index}
            href={action.link}
            target={action.external ? '_blank' : '_self'}
            rel={action.external ? 'noopener noreferrer' : ''}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            className={`block p-4 rounded-xl border transition-all ${
              action.urgent
                ? 'bg-red-500/10 border-red-500/50 hover:border-red-500'
                : 'bg-gray-800/40 border-gray-700/30 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                action.urgent
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${action.urgent ? 'text-red-400' : 'text-white'}`}>
                    {action.label}
                  </h4>
                  {action.external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                  {action.urgent && (
                    <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full uppercase font-bold">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{action.description}</p>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
