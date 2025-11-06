'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  HelpCircle, 
  Search,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Star,
  ArrowRight,
  X,
  CheckCircle,
  ExternalLink,
  ShoppingCart,
  CreditCard,
  Truck,
  Package,
  RotateCcw,
  Shield,
  User,
  Key,
  Ticket,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSearchResults]);
  const helpArticles = [
    {
      id: 1,
      title: 'Como fazer um pedido',
      category: 'Compras',
      icon: ShoppingCart,
      description: 'Aprenda passo a passo como realizar sua compra na MobiliAI',
      link: '/faq',
      popular: true,
      tags: ['pedido', 'compra', 'checkout']
    },
    {
      id: 2,
      title: 'Formas de pagamento aceitas',
      category: 'Compras',
      icon: CreditCard,
      description: 'Conheça todas as opções de pagamento disponíveis',
      link: '/faq',
      popular: true,
      tags: ['pagamento', 'cartão', 'pix', 'boleto']
    },
    {
      id: 3,
      title: 'Prazos e valores de entrega',
      category: 'Entrega',
      icon: Truck,
      description: 'Saiba quanto tempo leva e quanto custa a entrega',
      link: '/shipping',
      popular: true,
      tags: ['entrega', 'prazo', 'frete', 'envio']
    },
    {
      id: 4,
      title: 'Como acompanhar meu pedido',
      category: 'Entrega',
      icon: Package,
      description: 'Acompanhe seu pedido em tempo real',
      link: '/shipping',
      popular: false,
      tags: ['rastreamento', 'pedido', 'acompanhar']
    },
    {
      id: 5,
      title: 'Política de troca e devolução',
      category: 'Produtos',
      icon: RotateCcw,
      description: 'Entenda como funciona a troca e devolução',
      link: '/returns',
      popular: true,
      tags: ['devolução', 'troca', 'reembolso']
    },
    {
      id: 6,
      title: 'Garantia dos produtos',
      category: 'Produtos',
      icon: Shield,
      description: 'Saiba tudo sobre a garantia de 12 meses',
      link: '/warranty',
      popular: false,
      tags: ['garantia', 'defeito', 'reparo']
    },
    {
      id: 7,
      title: 'Como criar uma conta',
      category: 'Conta',
      icon: User,
      description: 'Crie sua conta e comece a comprar',
      link: '/faq',
      popular: false,
      tags: ['conta', 'cadastro', 'registro']
    },
    {
      id: 8,
      title: 'Recuperar senha',
      category: 'Conta',
      icon: Key,
      description: 'Esqueceu sua senha? Saiba como recuperar',
      link: '/faq',
      popular: false,
      tags: ['senha', 'recuperar', 'login']
    },
    {
      id: 9,
      title: 'Cupons e descontos',
      category: 'Compras',
      icon: Ticket,
      description: 'Como usar cupons de desconto na sua compra',
      link: '/faq',
      popular: false,
      tags: ['cupom', 'desconto', 'promoção']
    },
    {
      id: 10,
      title: 'Frete grátis',
      category: 'Entrega',
      icon: Box,
      description: 'Condições para ganhar frete grátis',
      link: '/shipping',
      popular: true,
      tags: ['frete', 'grátis', 'entrega']
    }
  ];

  const helpCategories = [
    {
      title: 'Compras',
      icon: ShoppingCart,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      topics: [
        { title: 'Como fazer um pedido', link: '/faq' },
        { title: 'Formas de pagamento', link: '/faq' },
        { title: 'Cupons e descontos', link: '/faq' },
        { title: 'Carrinho de compras', link: '/faq' },
        { title: 'Parcelamento', link: '/faq' }
      ]
    },
    {
      title: 'Entrega',
      icon: Truck,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      topics: [
        { title: 'Prazos de entrega', link: '/shipping' },
        { title: 'Cálculo de frete', link: '/shipping' },
        { title: 'Acompanhar pedido', link: '/shipping' },
        { title: 'Locais de entrega', link: '/shipping' },
        { title: 'Frete grátis', link: '/shipping' }
      ]
    },
    {
      title: 'Produtos',
      icon: Package,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      topics: [
        { title: 'Trocas e devoluções', link: '/returns' },
        { title: 'Garantia', link: '/warranty' },
        { title: 'Cuidados com produtos', link: '/faq' },
        { title: 'Especificações técnicas', link: '/faq' },
        { title: 'Montagem', link: '/faq' }
      ]
    },
    {
      title: 'Conta',
      icon: User,
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
      topics: [
        { title: 'Criar conta', link: '/faq' },
        { title: 'Recuperar senha', link: '/faq' },
        { title: 'Meus pedidos', link: '/faq' },
        { title: 'Dados pessoais', link: '/faq' },
        { title: 'Endereços', link: '/faq' }
      ]
    }
  ];

  const quickLinks = [
    { title: 'Envio e Entrega', href: '/shipping', icon: Truck, description: 'Prazos, valores e formas de entrega' },
    { title: 'Troca e Devolução', href: '/returns', icon: RotateCcw, description: 'Política de troca e devolução' },
    { title: 'Garantia', href: '/warranty', icon: Shield, description: 'Garantia de 12 meses' },
    { title: 'Perguntas Frequentes', href: '/faq', icon: HelpCircle, description: 'Respostas para dúvidas comuns' }
  ];

  // Filtrar artigos baseado na busca
  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return helpArticles.filter(article => 
      article.title.toLowerCase().includes(term) ||
      article.description.toLowerCase().includes(term) ||
      article.category.toLowerCase().includes(term) ||
      article.tags.some(tag => tag.toLowerCase().includes(term))
    ).slice(0, 5);
  }, [searchTerm]);

  const popularArticles = helpArticles.filter(article => article.popular);

  return (
    <div className="min-h-screen bg-white page-with-fixed-header">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b  border-gray-200 bg-gradient-to-b from-[#3e2626] to-[#2a1f1f] text-white">
        <div className=" container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Central de Ajuda
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                Encontre respostas rápidas para suas dúvidas
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Busque por palavras-chave, perguntas ou tópicos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                onFocus={() => setShowSearchResults(searchTerm.length > 0)}
                className="pl-12 pr-12 py-6 text-base bg-white/95 border-0 rounded-xl shadow-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              
              {/* Search Results Dropdown */}
              {showSearchResults && filteredArticles.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">
                      Resultados da Busca
                    </div>
                    {filteredArticles.map((article) => (
                      <Link
                        key={article.id}
                        href={article.link}
                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        onClick={() => {
                          setSearchTerm('');
                          setShowSearchResults(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <article.icon className="h-5 w-5 text-[#3e2626]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-[#3e2626] group-hover:text-[#2a1f1f] transition-colors">
                                {article.title}
                              </h4>
                              <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{article.description}</p>
                            <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {article.category}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {showSearchResults && searchTerm && filteredArticles.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Nenhum resultado encontrado</p>
                    <p className="text-sm text-gray-500">Tente buscar com outras palavras-chave</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-[#3e2626]" />
            <h2 className="text-2xl font-bold text-[#3e2626]">Artigos Populares</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article) => (
              <Link
                key={article.id}
                href={article.link}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#3e2626] group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#3e2626]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <article.icon className="h-6 w-6 text-[#3e2626]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-gray-500 font-medium">Popular</span>
                    </div>
                    <h3 className="font-semibold text-[#3e2626] group-hover:text-[#2a1f1f] transition-colors mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#3e2626] font-medium">
                      <span>Ler mais</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#3e2626] mb-6">Links Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-gray-200 hover:border-[#3e2626] group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#3e2626]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#3e2626] transition-colors">
                    <link.icon className="h-8 w-8 text-[#3e2626] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-[#3e2626] group-hover:text-[#2a1f1f] transition-colors mb-2">
                    {link.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {link.description}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#3e2626] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Acessar</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-6 w-6 text-[#3e2626]" />
            <h2 className="text-2xl font-bold text-[#3e2626]">Categorias de Ajuda</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpCategories.map((category) => (
              <div
                key={category.title}
                className={`bg-white border-2 ${category.color} rounded-xl p-6 hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 ${category.color} rounded-xl flex items-center justify-center`}>
                    <category.icon className={`h-7 w-7 ${category.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-[#3e2626]">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.topics.map((topic, index) => (
                    <li key={index}>
                      <Link
                        href={topic.link}
                        className="text-gray-700 hover:text-[#3e2626] flex items-center gap-3 transition-colors group py-2"
                      >
                        <div className={`w-6 h-6 rounded-full ${category.color} flex items-center justify-center flex-shrink-0`}>
                          <CheckCircle className={`h-4 w-4 ${category.iconColor}`} />
                        </div>
                        <span className="flex-1 group-hover:font-medium transition-all">{topic.title}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#3e2626] transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#3e2626] mb-4">Ainda precisa de ajuda?</h2>
            <p className="text-gray-600 text-lg">
              Nossa equipe está pronta para ajudar você
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="font-bold text-[#3e2626] mb-2 text-lg">Chat Online</h3>
              <p className="text-sm text-gray-600 mb-4">Atendimento em tempo real</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <Clock className="h-4 w-4" />
                <span>Seg-Sex: 8h às 18h</span>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Iniciar Chat
              </Button>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-sm border-2 border-green-100 hover:border-green-300 transition-all duration-300 text-center group">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="font-bold text-[#3e2626] mb-2 text-lg">E-mail</h3>
              <p className="text-sm text-gray-600 mb-4">Resposta em até 24h</p>
              <a
                href="mailto:suporte@mobiliai.com.br"
                className="text-[#3e2626] hover:text-green-600 font-medium text-sm block mb-4 transition-colors"
              >
                suporte@mobiliai.com.br
              </a>
              <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                Enviar E-mail
              </Button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl shadow-sm border-2 border-orange-100 hover:border-orange-300 transition-all duration-300 text-center group">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Phone className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="font-bold text-[#3e2626] mb-2 text-lg">Telefone</h3>
              <p className="text-sm text-gray-600 mb-4">Ligue para nós</p>
              <a
                href="tel:+5511999999999"
                className="text-[#3e2626] hover:text-orange-600 font-bold text-lg block mb-4 transition-colors"
              >
                (11) 99999-9999
              </a>
              <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                Ligar Agora
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

