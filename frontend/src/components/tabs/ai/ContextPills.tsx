import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextPillsProps {
  pills: string[];
  compact?: boolean;
}

const ContextPills: React.FC<ContextPillsProps> = ({ pills, compact = false }) => {
  if (pills.length === 0) return null;

  const getPillColor = (pill: string): string => {
    const lower = pill.toLowerCase();
    if (lower.includes('ready') || lower.includes('complete')) return 'bg-primary/20 border-primary/30 text-primary';
    if (lower.includes('optimiz') || lower.includes('final')) return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    if (lower.includes('explor') || lower.includes('analyz')) return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
    if (lower.includes('aggregat') || lower.includes('transform')) return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    if (lower.includes('visual')) return 'bg-green-500/20 border-green-500/30 text-green-400';
    return 'bg-white/10 border-white/20 text-white/60';
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        {pills.slice(0, 3).map((pill, index) => (
          <motion.span
            key={pill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${getPillColor(pill)}`}
          >
            {pill}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence mode="popLayout">
        {pills.map((pill, index) => (
          <motion.div
            key={pill}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.05,
              layout: { type: "spring", damping: 20, stiffness: 300 }
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border backdrop-blur-sm ${getPillColor(pill)}`}
          >
            {pill}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ContextPills;