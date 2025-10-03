'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página inicial (loja) mas mantendo o usuário logado
    router.replace('/');
  }, [router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para a loja...</p>
      </div>
    </div>
  );
}
