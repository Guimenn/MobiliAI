'use client';

import { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Usar requestAnimationFrame para garantir que o DOM esteja pronto
    const timer = requestAnimationFrame(() => {
      setHasMounted(true);
    });
    
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!hasMounted) {
    return <span suppressHydrationWarning={true}>{fallback}</span>;
  }

  return <span suppressHydrationWarning={true}>{children}</span>;
}