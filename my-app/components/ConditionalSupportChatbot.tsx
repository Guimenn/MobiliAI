'use client';

import { usePathname } from 'next/navigation';
import SupportChatbot from './SupportChatbot';

export default function ConditionalSupportChatbot() {
  const pathname = usePathname();
  
  // Não renderizar o chatbot na página de login
  if (pathname === '/login') {
    return null;
  }
  
  return <SupportChatbot />;
}


