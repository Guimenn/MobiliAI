'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Loading from './Loading';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated || !user || !token) {
      router.push('/login');
      return;
    }

    // Se tem role específico requerido, verificar
    if (requiredRole && user.role !== requiredRole) {
      // Redirecionar para o dashboard apropriado do usuário
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'store_manager':
          router.push('/manager');
          break;
        case 'cashier':
          router.push('/employee');
          break;
        case 'customer':
          router.push('/customer');
          break;
        default:
          router.push('/login');
      }
      return;
    }
  }, [isAuthenticated, user, token, requiredRole, router]);

  // Se não está autenticado, não renderizar nada
  if (!isAuthenticated || !user || !token) {
    return <Loading />;
  }

  // Se tem role específico e não é o correto, não renderizar
  if (requiredRole && user.role !== requiredRole) {
    return <Loading />;
  }

  return <>{children}</>;
}
