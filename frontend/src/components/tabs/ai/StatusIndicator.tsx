import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusIndicatorProps {
  status: string;
  progress?: number; // 0-100
  phase?: 'initial' | 'processing' | 'finalizing' | 'complete';
  isVisible: boolean;
  compact?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  progress = 0,
  phase = 'initial',
  isVisible,
  compact = false
}) => {
  // Smart dot rendering based on progress
  const getDotState = (index: number): 'active' | 'complete' | 'pending' => {
    const threshold = (index + 1) * 25;
    if (progress >= threshold) return 'complete';
    if (progress > threshold - 25 && progress < threshold) return 'active';
    return 'pending';
  };

  const getDotClass = (state: 'active' | 'complete' | 'pending') => {
    switch (state) {
      case 'complete':
        return 'bg-primary/80';
      case 'active':
        return 'bg-primary/60 animate-pulse';
      case 'pending':
        return 'bg-white/20';
    }
  };

  if (!isVisible) return null;

  if (compact) {
    // Ultra-compact single line
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center gap-2 text-xs text-white/60"
      >
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-all ${getDotClass(getDotState(i))}`}
            />
          ))}
        </div>
        <span>{status}</span>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            phase === 'complete' 
              ? 'bg-primary/5 border border-primary/20' 
              : 'bg-white/5 border border-white/10'
          }`}
        >
          {/* Smart progress dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: getDotState(index) !== 'pending' ? 1 : 0.8,
                }}
                transition={{ 
                  duration: 0.2, 
                  delay: index * 0.05 
                }}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  getDotClass(getDotState(index))
                }`}
              />
            ))}
          </div>
          
          {/* Status text with phase-aware styling and bigger font when in progress */}
          <span className={`font-medium transition-all duration-300 ${
            phase === 'complete' 
              ? 'text-primary/90 text-xs' 
              : phase === 'finalizing'
              ? 'text-white/80 text-sm'
              : phase === 'processing'
              ? 'text-white/80 text-sm font-semibold'
              : 'text-white/70 text-xs'
          }`}>
            {status}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusIndicator;