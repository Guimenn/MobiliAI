'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-[#3e2626] mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Página não encontrada</h2>
          <p className="text-lg text-gray-600 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <Button
            onClick={() => router.push('/')}
            className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white px-8 py-6 rounded-full font-semibold text-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Voltar ao Início
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

