'use client';

import { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'cashier' | 'customer';
    storeId?: string;
  } | null;
  cashOpen?: boolean;
  cartCount?: number;
  onLogout: () => void;
  onToggleCash?: () => void;
}

export default function Layout({ 
  children, 
  user, 
  cashOpen, 
  cartCount, 
  onLogout, 
  onToggleCash 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={user}
        cashOpen={cashOpen}
        cartCount={cartCount}
        onLogout={onLogout}
        onToggleCash={onToggleCash}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
