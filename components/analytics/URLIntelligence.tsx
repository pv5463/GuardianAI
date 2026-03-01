'use client';

import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface URLIntelligenceProps {
  url: string;
}

export default function URLIntelligence({ url }: URLIntelligenceProps) {
  const analysis = analyzeURL(url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <h3 className="text-xl font-bold text-white mb-6">URL Intelligence Analysis</h3>
      <div className="space-y-4">
        {analysis.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30"
          >
            <div className="flex-shrink-0 mt-1">
              {item.status === 'safe' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
              {item.status === 'danger' && <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-white font-semibold">{item.label}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.status === 'safe' ? 'bg-green-500/20 text-green-400' :
                  item.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {item.riskWeight}% risk
                </span>
              </div>
              <p className="text-gray-400 text-sm">{item.explanation}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function analyzeURL(url: string) {
  const analysis = [];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    analysis.push({
      label: 'HTTPS Protocol',
      status: urlObj.protocol === 'https:' ? 'safe' : 'danger',
      explanation: urlObj.protocol === 'https:' 
        ? 'Connection is encrypted and secure'
        : 'Unencrypted connection - data can be intercepted',
      riskWeight: urlObj.protocol === 'https:' ? 0 : 25
    });

    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.info'];
    const hasSuspiciousTLD = suspiciousTLDs.some(tld => hostname.endsWith(tld));
    analysis.push({
      label: 'Top-Level Domain',
      status: hasSuspiciousTLD ? 'danger' : 'safe',
      explanation: hasSuspiciousTLD
        ? 'Uses suspicious TLD commonly associated with scams'
        : 'Uses standard domain extension',
      riskWeight: hasSuspiciousTLD ? 30 : 0
    });

    const subdomainCount = hostname.split('.').length - 2;
    analysis.push({
      label: 'Subdomain Structure',
      status: subdomainCount > 2 ? 'warning' : 'safe',
      explanation: subdomainCount > 2
        ? `Excessive subdomains (${subdomainCount}) detected - possible manipulation`
        : 'Normal domain structure',
      riskWeight: subdomainCount > 2 ? 20 : 0
    });

    const trustedBrands = ['sbi', 'hdfc', 'icici', 'paytm', 'amazon', 'google'];
    const brandMention = trustedBrands.find(brand => hostname.includes(brand));
    const officialDomains = {
      'sbi': ['onlinesbi.sbi', 'sbi.co.in'],
      'hdfc': ['hdfcbank.com'],
      'icici': ['icicibank.com'],
      'paytm': ['paytm.com'],
      'amazon': ['amazon.in', 'amazon.com'],
      'google': ['google.com']
    };

    if (brandMention) {
      const isOfficial = officialDomains[brandMention as keyof typeof officialDomains]?.some(
        domain => hostname.endsWith(domain)
      );
      analysis.push({
        label: 'Brand Verification',
        status: isOfficial ? 'safe' : 'danger',
        explanation: isOfficial
          ? `Official ${brandMention.toUpperCase()} domain verified`
          : `Impersonates ${brandMention.toUpperCase()} but is NOT official domain`,
        riskWeight: isOfficial ? 0 : 40
      });
    }

    const isIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
    analysis.push({
      label: 'Domain Type',
      status: isIPAddress ? 'danger' : 'safe',
      explanation: isIPAddress
        ? 'Uses IP address instead of domain name - major red flag'
        : 'Uses proper domain name',
      riskWeight: isIPAddress ? 35 : 0
    });

  } catch (error) {
    analysis.push({
      label: 'URL Format',
      status: 'danger',
      explanation: 'Invalid or malformed URL structure',
      riskWeight: 50
    });
  }

  return analysis;
}
