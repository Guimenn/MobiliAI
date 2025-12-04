'use client';

import React from 'react';
import { Loader } from '@/components/ui/ai/loader';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  text?: string;
  variant?: 'default' | 'spinner' | 'dots' | 'pulse' | 'ring';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function PageLoader({ 
  text = 'Carregando...',
  variant = 'default',
  size = 'xl',
  className 
}: PageLoaderProps) {
  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center",
      "bg-gradient-to-br from-gray-50 via-white to-gray-100",
      "dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
      className
    )}>
      <div className="text-center space-y-6">
        <Loader 
          size={size} 
          variant={variant} 
          text={text}
          className="mx-auto"
        />
      </div>
    </div>
  );
}

