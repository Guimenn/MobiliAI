'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { env } from '@/lib/env';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export default function AuthGuard({ children, requiredRole, redirectTo }: AuthGuardProps) {
  const { user, isAuthenticated, token, logout } = useAppStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  // Ativar timeout de sessão
  useSessionTimeout();

  useEffect(() => {
    const checkAuth = async () => {
      // Se não está autenticado ou não tem token, redirecionar para login
      if (!isAuthenticated || !user || !token) {
        router.replace('/login');
        return;
      }

      // Verificar modo de manutenção (exceto para admins)
      if (user.role !== 'ADMIN' && user.role !== 'admin') {
        try {
          const response = await fetch(`${env.API_URL}/public/maintenance-mode`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const maintenanceData = await response.json();
            if (maintenanceData?.maintenanceMode === true) {
              console.log('Modo de manutenção ativo, bloqueando usuário não-admin');
              logout();
              router.replace('/login?maintenance=true');
              return;
            }
          } else {
            console.warn('Erro ao verificar modo de manutenção:', response.status);
          }
        } catch (error) {
          console.error('Erro ao verificar modo de manutenção:', error);
        }
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
  }, [isAuthenticated, user, token, requiredRole, redirectTo, router, logout]);

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