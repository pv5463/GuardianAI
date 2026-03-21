'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
}

export default function GlassCard({ children, className = '', hover = true, animate = true }: GlassCardProps) {
  const Component = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  } : {};
  
  const hoverProps = hover ? {
    whileHover: { y: -5, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' }
  } : {};
  
  return (
    <Component
      {...animationProps}
      {...hoverProps}
      className={`bg-gradient-to-br from-glass-light to-glass-medium backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-glass transition-all duration-300 ${className}`}
    >
      {children}
    </Component>
  );
}
