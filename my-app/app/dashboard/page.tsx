'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, 
  Users, 
  Package, 
  BarChart3, 
  ShoppingCart,
  Shield,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirecionar baseado no papel do usuário
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'STORE_MANAGER':
          router.push('/manager');
          break;
        case 'CASHIER':
          router.push('/');
          break;
        case 'CUSTOMER':
          router.push('/');
          break;
        default:
          router.push('/login');
          break;
      }
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Este componente não será renderizado devido ao redirecionamento
  return null;
}
