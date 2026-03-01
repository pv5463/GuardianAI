'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ScamTypeChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export default function ScamTypeChart({ data }: ScamTypeChartProps) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-white mb-6">Scam Type Distribution</h3>
        <div className="h-80 flex items-center justify-center text-gray-400">
          No scan data available yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
    >
      <h3 className="text-xl font-bold text-white mb-6">Scam Type Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '0.5rem',
              color: '#fff'
            }}
          />
          <Legend
            wrapperStyle={{ color: '#9ca3af' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
