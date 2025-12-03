'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle, Palette, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { BackgroundBeams } from '@/components/ui/shadcn-io/background-beams';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-center overflow-hidden antialiased">
      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Image
            src="/logotipos/11.svg"
            alt="Logo"
            width={200}
            height={80}
            className="h-20 sm:h-24 md:h-28 w-auto drop-shadow-2xl"
            style={{ 
              filter: 'brightness(0) saturate(100%) invert(8%) sepia(15%) saturate(1800%) hue-rotate(330deg) brightness(0.95) contrast(0.9)',
            }}
            priority
          />
        </div>

        {/* Número 404 com efeito */}
        <div className="relative mb-8 flex items-center justify-center">
          <h1 className="relative z-10 text-[120px] sm:text-[150px] md:text-[180px] lg:text-[220px] font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#5a3a3a] to-[#3e2626] tracking-tight leading-none">
            404
          </h1>
          <h1 className="absolute text-[120px] sm:text-[150px] md:text-[180px] lg:text-[220px] font-bold text-[#3e2626]/20 blur-xl tracking-tight leading-none pointer-events-none">
            404
          </h1>
        </div>

        {/* Mensagem principal */}
        <div className="mb-10 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3e2626]">
              Página não encontrada
            </h2>
          </div>
          
          <p className="text-lg sm:text-xl text-[#5a3a3a] max-w-md mx-auto leading-relaxed">
            A página que você está procurando não existe ou foi movida. 
            Mas não se preocupe, vamos te ajudar a encontrar o que precisa!
          </p>
        </div>

        {/* Botão de ação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="group relative bg-[#3e2626] text-white hover:bg-[#5a3a3a] rounded-full px-8 md:px-10 py-6 md:py-7 text-base font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            <span className="relative flex items-center gap-3">
              <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Voltar ao Início</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Button>
          
          <Button
            onClick={() => router.push('/products')}
            size="lg"
            variant="outline"
            className="group relative bg-transparent border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626]/5 hover:border-[#5a3a3a] rounded-full px-8 md:px-10 py-6 md:py-7 text-base font-bold transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-3">
              <Palette className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Ver Produtos</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Background Beams */}
      <BackgroundBeams />
    </div>
  );
}

