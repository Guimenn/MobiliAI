"use client";

import Link from "next/link";
import { 
  Building2,
  HelpCircle,
  Shield,
  FileText,
  CreditCard
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#3e2626] text-white border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
            {/* Brand Section */}
            <div className="md:col-span-1 flex flex-col">
              <div className="w-full h-20 bg-cover bg-center bg-no-repeat mb-12 translate-x-[-30px]"
          style={{ backgroundImage: 'url(/logotipos/11.svg)' }}>
               
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-xs">
                Transforme sua casa com móveis inteligentes e tecnologia de IA. 
                Visualize móveis reais antes de comprar.
              </p>
              
            </div>

            {/* Empresa Section */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-6 h-6">
                <Building2 className="h-4 w-4 text-white/60" />
                <h3 className="text-white font-semibold text-base uppercase tracking-wide">Empresa</h3>
              </div>
              <nav className="space-y-3 flex-1">
                <Link 
                  href="/about" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Sobre Nós
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Contato
                </Link>
                <Link 
                  href="/stores" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Nossas Lojas
                </Link>
                <Link 
                  href="/careers" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Carreiras
                </Link>
                <Link 
                  href="/blog" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Blog
                </Link>
              </nav>
            </div>

            {/* Suporte Section */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-6 h-6">
                <HelpCircle className="h-4 w-4 text-white/60" />
                <h3 className="text-white font-semibold text-base uppercase tracking-wide">Suporte</h3>
              </div>
              <nav className="space-y-3 flex-1">
                <Link 
                  href="/help" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Central de Ajuda
                </Link>
                <Link 
                  href="/shipping" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Envio e Entrega
                </Link>
                <Link 
                  href="/returns" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Troca e Devolução
                </Link>
                <Link 
                  href="/warranty" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Garantia
                </Link>
                <Link 
                  href="/faq" 
                  className="block text-white/70 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 transform"
                >
                  Perguntas Frequentes
                </Link>
              </nav>
            </div>

            {/* Pagamento Section */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-6 h-6">
                <CreditCard className="h-4 w-4 text-white/60" />
                <h3 className="text-white font-semibold text-base uppercase tracking-wide">Pagamento</h3>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {/* VISA - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/a65c5d1c5e556c6197f8fbd607482372" 
                    alt="Visa" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* Mastercard - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/95d849253f75d5e6e6b867af4f7c65aa" 
                    alt="Mastercard" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* Elo - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/br-11134258-7r98o-lxsovyseln7jc5" 
                    alt="Elo" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* American Express - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/285e5ab6207eb562a9e893a42ff7ee46 " 
                    alt="American Express" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* Boleto - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/44734b7fc343eb46237c2d90c6c9ca60" 
                    alt="Boleto" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* PIX - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/2a2cfeb34b00ef7b3be23ea516dcd1c5" 
                    alt="PIX" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
              <p className="text-white/80 text-sm font-medium">
                &copy; {currentYear} MobiliAI
              </p>
              <p className="text-white/60 text-sm">
                Todos os direitos reservados.
              </p>
            </div>

            {/* Legal Links */}
            <nav className="flex items-center space-x-6">
              <Link 
                href="/privacy" 
                className="text-white/60 hover:text-white text-sm transition-colors duration-200 font-medium"
              >
                Política de Privacidade
              </Link>
              <span className="text-white/30">•</span>
              <Link 
                href="/terms" 
                className="text-white/60 hover:text-white text-sm transition-colors duration-200 font-medium"
              >
                Termos de Uso
              </Link>
            </nav>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-2 md:space-y-0 text-xs text-white/50">
              <p className="text-center md:text-left">
                 MobiliAI Comércio de Móveis LTDA
              </p>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
