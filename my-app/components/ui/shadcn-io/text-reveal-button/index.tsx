'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface TextRevealButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  className?: string;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export const TextRevealButton = React.forwardRef<HTMLButtonElement, TextRevealButtonProps>(
  ({ text, className, icon, asChild, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex h-12 overflow-hidden rounded-full border border-[#3e2626]/20 bg-white/80 px-8 text-sm font-semibold text-[#3e2626] backdrop-blur-sm transition-all hover:bg-[#3e2626] hover:text-white hover:shadow-xl',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {icon && <span className="relative z-10">{icon}</span>}
          {text.split('').map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: 0, opacity: 1 }}
              animate={
                isHovered
                  ? {
                      y: [0, -20, 0],
                      opacity: [1, 0, 1],
                    }
                  : {
                      y: 0,
                      opacity: 1,
                    }
              }
              transition={{
                duration: 0.5,
                delay: index * 0.02,
                ease: 'easeInOut',
              }}
              style={{ display: 'inline-block' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </span>
        <motion.span
          className="absolute inset-0 z-0 flex items-center justify-center gap-2"
          initial={{ y: '100%' }}
          animate={isHovered ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {icon && <span className="relative z-10">{icon}</span>}
          {text.split('').map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={
                isHovered
                  ? {
                      y: 0,
                      opacity: 1,
                    }
                  : {
                      y: 20,
                      opacity: 0,
                    }
              }
              transition={{
                duration: 0.5,
                delay: index * 0.02,
                ease: 'easeInOut',
              }}
              style={{ display: 'inline-block' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.span>
      </motion.button>
    );
  }
);

TextRevealButton.displayName = 'TextRevealButton';

