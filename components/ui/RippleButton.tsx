'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function RippleButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  variant = 'primary'
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-cyber-blue to-cyber-purple shadow-glow-blue hover:shadow-glow-purple';
      case 'secondary':
        return 'bg-gradient-to-br from-glass-light to-glass-medium border border-white/10 hover:border-cyber-blue/50';
      case 'danger':
        return 'bg-gradient-to-r from-cyber-red to-pink-500 shadow-glow-red';
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
    
    onClick?.();
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${getVariantStyles()} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ 
            width: 500, 
            height: 500, 
            opacity: 0,
            x: -250,
            y: -250
          }}
          transition={{ duration: 0.6 }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
