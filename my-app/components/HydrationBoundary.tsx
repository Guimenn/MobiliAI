'use client';

import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/ai/loader';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationBoundary({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader size={48} className="mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}: HydrationBoundaryProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
