'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type LoaderProps = {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'spinner' | 'dots' | 'pulse' | 'ring';
  text?: string;
};

const sizeMap = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

export const Loader = ({ 
  className, 
  size = 'md',
  variant = 'default',
  text
}: LoaderProps) => {
  const numericSize = typeof size === 'number' ? size : sizeMap[size];
  
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerLoader size={numericSize} />;
      case 'dots':
        return <DotsLoader size={numericSize} />;
      case 'pulse':
        return <PulseLoader size={numericSize} />;
      case 'ring':
        return <RingLoader size={numericSize} />;
      default:
        return <SpinnerLoader size={numericSize} />;
    }
  };

  return (
    <>
      <LoaderStyles />
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div 
          className="relative"
          style={{ 
            width: `${numericSize}px`,
            height: `${numericSize}px`,
          }}
        >
          {renderLoader()}
        </div>
        {text && (
          <p className="mt-4 text-sm font-light text-muted-foreground tracking-wide">
            {text}
          </p>
        )}
      </div>
    </>
  );
};

// Componente para injetar os estilos CSS
const LoaderStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @keyframes loader-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes loader-dot-bounce {
        0%, 80%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        40% {
          transform: translateY(-12px);
          opacity: 1;
        }
      }
      @keyframes loader-pulse-ring {
        0% {
          transform: scale(0.8);
          opacity: 0.6;
        }
        50% {
          opacity: 0.2;
        }
        100% {
          transform: scale(1.2);
          opacity: 0;
        }
      }
      @keyframes loader-pulse-core {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `
  }} />
);

// Spinner Loader - Elegante e minimalista
const SpinnerLoader = ({ size }: { size: number }) => {
  const strokeWidth = Math.max(2, size / 16);
  const radius = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset1 = circumference * 0.75;
  const offset2 = circumference * 0.25;
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ animation: 'loader-spin 1s linear infinite' }}
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--muted-foreground))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset1}
          className="opacity-60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset2}
          className="opacity-100"
        />
      </svg>
    </div>
  );
};

// Dots Loader - Três pontos elegantes
const DotsLoader = ({ size }: { size: number }) => {
  const dotSize = size / 5;
  const bounceHeight = size / 4;
  
  const dotStyle = (delay: number, opacity: number): React.CSSProperties => ({
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: '50%',
    backgroundColor: 'hsl(var(--primary))',
    animation: 'loader-dot-bounce 1.4s ease-in-out infinite',
    animationDelay: `${delay}s`,
    opacity,
  });
  
  return (
    <div className="relative w-full h-full flex items-center justify-center gap-2">
      <div style={dotStyle(0, 0.6)} />
      <div style={dotStyle(0.2, 0.8)} />
      <div style={dotStyle(0.4, 1)} />
    </div>
  );
};

// Pulse Loader - Anel pulsante elegante
const PulseLoader = ({ size }: { size: number }) => {
  const ringStyle1: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: '2px solid hsl(var(--primary))',
    opacity: 0.2,
    animation: 'loader-pulse-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
  };
  
  const ringStyle2: React.CSSProperties = {
    position: 'absolute',
    width: `${size * 0.7}px`,
    height: `${size * 0.7}px`,
    borderRadius: '50%',
    border: '2px solid hsl(var(--primary))',
    opacity: 0.4,
    animation: 'loader-pulse-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
    animationDelay: '0.5s',
  };
  
  const coreStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size / 4}px`,
    height: `${size / 4}px`,
    borderRadius: '50%',
    backgroundColor: 'hsl(var(--primary))',
    opacity: 0.6,
    animation: 'loader-pulse-core 1.5s ease-in-out infinite',
  };
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div style={ringStyle1} />
      <div style={ringStyle2} />
      <div style={coreStyle} />
    </div>
  );
};

// Ring Loader - Anel rotativo minimalista
const RingLoader = ({ size }: { size: number }) => {
  const strokeWidth = Math.max(2, size / 12);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * 0.7;
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="animate-spin"
        style={{ animation: 'loader-spin 1.2s linear infinite' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="opacity-100"
        />
      </svg>
    </div>
  );
};
