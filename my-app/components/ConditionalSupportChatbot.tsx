'use client';

import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import SupportChatbot from './SupportChatbot';

export default function ConditionalSupportChatbot() {
  const pathname = usePathname();
  const { user } = useAppStore();
  
  // Não renderizar o chatbot na página de login
  if (pathname === '/login') {
    return null;
  }
  
  // Não renderizar o chatbot em páginas de admin, gerente ou funcionário
  if (pathname.startsWith('/admin') || pathname.startsWith('/manager') || pathname.startsWith('/employee')) {
    return null;
  }
  
  // Não renderizar o chatbot para usuários com roles de admin, gerente ou funcionário
  if (user) {
    const userRole = user.role?.toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'STORE_MANAGER' || userRole === 'EMPLOYEE' || userRole === 'CASHIER') {
      return null;
    }
  }
  
  return <SupportChatbot />;
}


