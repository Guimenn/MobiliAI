'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export default function AuthGuard({ children, requiredRole, redirectTo }: AuthGuardProps) {
  const { user, isAuthenticated, token, logout } = useAppStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Se não está autenticado ou não tem token, redirecionar para login
      if (!isAuthenticated || !user || !token) {
        router.replace('/login');
        return;
      }

      // Se tem role específico requerido e não é o role correto
      if (requiredRole && user.role !== requiredRole) {
        // Redirecionar para o dashboard apropriado
        switch (user.role) {
          case 'ADMIN':
            router.replace('/admin/dashboard');
            break;
          case 'STORE_MANAGER':
            router.replace('/manager');
            break;
          case 'CASHIER':
            router.replace('/');
            break;
          case 'CUSTOMER':
            router.replace('/');
            break;
          default:
            router.replace('/login');
            break;
        }
        return;
      }

      // Se tem redirectTo específico
      if (redirectTo) {
        router.replace(redirectTo);
        return;
      }

      // Se chegou até aqui, está tudo ok
      setIsChecking(false);
    };

    // Verificar autenticação
    checkAuth();
  }, [isAuthenticated, user, token, requiredRole, redirectTo, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !token) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}