"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Mail,
  Phone,
  MapPin,
  Building2,
  HelpCircle,
  Shield,
  FileText
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#3e2626] text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="MobiliAI Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">MobiliAI</h2>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Transformando espaços</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs mb-6">
                Transforme sua casa com móveis inteligentes e tecnologia de IA. 
                Visualize móveis reais antes de comprar.
              </p>
              <div className="flex items-center space-x-2 text-xs text-white/50">
                <Shield className="h-4 w-4" />
                <span>Site seguro e protegido</span>
              </div>
            </div>

            {/* Empresa Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Building2 className="h-4 w-4 text-white/60" />
                <h3 className="text-white font-semibold text-base uppercase tracking-wide">Empresa</h3>
              </div>
              <nav className="space-y-3">
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
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <HelpCircle className="h-4 w-4 text-white/60" />
                <h3 className="text-white font-semibold text-base uppercase tracking-wide">Suporte</h3>
              </div>
              <nav className="space-y-3">
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

            {/* Contato Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Phone className="h-4 w-4 text-white/60" />
                <h3 className="text-white font-semibold text-base uppercase tracking-wide">Contato</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">(11) 4000-0000</p>
                    <p className="text-white/60 text-xs mt-0.5">Segunda a Sexta: 8h às 18h</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">contato@mobiliai.com.br</p>
                    <p className="text-white/60 text-xs mt-0.5">Resposta em até 24h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">São Paulo, SP</p>
                    <p className="text-white/60 text-xs mt-0.5">Múltiplas lojas físicas</p>
                  </div>
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
              <span className="text-white/30">•</span>
              <Link 
                href="/cookies" 
                className="text-white/60 hover:text-white text-sm transition-colors duration-200 font-medium"
              >
                Política de Cookies
              </Link>
            </nav>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-2 md:space-y-0 text-xs text-white/50">
              <p className="text-center md:text-left">
                CNPJ: 00.000.000/0001-00 | MobiliAI Comércio de Móveis LTDA
              </p>
              <div className="flex items-center space-x-2">
                <FileText className="h-3 w-3" />
                <span>Certificado SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
