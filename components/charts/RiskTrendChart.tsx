'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RiskTrendChartProps {
  data: Array<{ date: string; highRisk: number; medium: number; low: number }>;
}

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <h3 className="text-xl font-bold text-white mb-6">Risk Level Trend (7 Days)</h3>
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-400">
          No trend data available yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '0.5rem',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line
              type="monotone"
              dataKey="highRisk"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1500}
              name="High Risk"
            />
            <Line
              type="monotone"
              dataKey="medium"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              animationDuration={1500}
              name="Medium Risk"
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              animationDuration={1500}
              name="Low Risk"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
