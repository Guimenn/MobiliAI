'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Loader } from '@/components/ui/ai/loader';

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página inicial (loja) mas mantendo o usuário logado
    router.replace('/');
  }, [router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader size="xl" variant="default" text="Redirecionando para a loja..." />
      </div>
    </div>
  );
}
