'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Star,
  Truck,
  Shield,
  CreditCard,
  Tag,
  ArrowRight,
  ArrowLeft,
  Play,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Sparkles,
  Palette,
  Camera,
  Home,
  Sofa,
  Lamp,
  Users,
  Table,
  Plus,
  Minus,
  Filter,
  Grid,
  List,
  LogOut,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAppStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeInspiration, setActiveInspiration] = useState(0);

  // Função para logout
  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    router.push('/');
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown')) {
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Dados mockados para demonstração
  const categories = [
    { id: 'sofa', name: 'Sofás', icon: Sofa, count: 24 },
    { id: 'chair', name: 'Cadeiras', icon: Users, count: 18 },
    { id: 'table', name: 'Mesas', icon: Table, count: 15 },
    { id: 'lamp', name: 'Luminárias', icon: Lamp, count: 12 },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: 'Sofá 3 Lugares Moderno',
      price: 2499.99,
      originalPrice: 2999.99,
      image: '/placeholder-sofa.jpg',
      rating: 4.8,
      reviews: 124,
      badge: 'Novo'
    },
    {
      id: 2,
      name: 'Cadeira Executiva Premium',
      price: 899.99,
      image: '/placeholder-chair.jpg',
      rating: 4.9,
      reviews: 89,
      badge: 'Mais Vendido'
    },
    {
      id: 3,
      name: 'Mesa de Centro Elegante',
      price: 1299.99,
      originalPrice: 1599.99,
      image: '/placeholder-table.jpg',
      rating: 4.7,
      reviews: 67,
      badge: 'Oferta'
    },
    {
      id: 4,
      name: 'Luminária Pendant Moderna',
      price: 599.99,
      image: '/placeholder-lamp.jpg',
      rating: 4.6,
      reviews: 45,
      badge: null
    },
    {
      id: 5,
      name: 'Poltrona Relax Premium',
      price: 1899.99,
      image: '/placeholder-armchair.jpg',
      rating: 4.8,
      reviews: 92,
      badge: null
    },
    {
      id: 6,
      name: 'Mesa de Jantar 6 Lugares',
      price: 2199.99,
      image: '/placeholder-dining.jpg',
      rating: 4.9,
      reviews: 156,
      badge: 'Novo'
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Maria Silva',
      rating: 5,
      text: 'Excelente qualidade e atendimento! Os móveis chegaram exatamente como esperado.',
      avatar: '/placeholder-avatar1.jpg'
    },
    {
      id: 2,
      name: 'João Santos',
      rating: 5,
      text: 'A IA para visualizar móveis é incrível! Consegui ver como ficaria antes de comprar.',
      avatar: '/placeholder-avatar2.jpg'
    },
    {
      id: 3,
      name: 'Ana Costa',
      rating: 5,
      text: 'Produtos de alta qualidade e entrega super rápida. Recomendo!',
      avatar: '/placeholder-avatar3.jpg'
    }
  ];

  const inspirations = [
    { id: 1, title: 'Sala Moderna', image: '/placeholder-inspiration1.jpg' },
    { id: 2, title: 'Quarto Minimalista', image: '/placeholder-inspiration2.jpg' },
    { id: 3, title: 'Cozinha Elegante', image: '/placeholder-inspiration3.jpg' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#3e2626]">MobiliAI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-[#3e2626] font-medium hover:text-[#8B4513] transition-colors">
                Início
              </Link>
              <Link href="/products" className="text-gray-600 hover:text-[#3e2626] transition-colors">
                Produtos
              </Link>
              <Link href="/ai-tools" className="text-gray-600 hover:text-[#3e2626] transition-colors">
                IA Decoradora
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-[#3e2626] transition-colors">
                Sobre
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-[#3e2626] transition-colors">
                Contato
              </Link>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar móveis..."
                  className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-[#8B4513]/20"
                />
        </div>
      </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <Link href="/customer" className="p-2 text-gray-600 hover:text-[#3e2626] transition-colors">
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link href="/customer" className="p-2 text-gray-600 hover:text-[#3e2626] transition-colors relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-[#8B4513] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      3
                    </span>
                  </Link>
                  
                  {/* User Dropdown */}
                  <div className="relative user-dropdown">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center space-x-2 p-2 text-gray-600 hover:text-[#3e2626] transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="hidden md:block text-sm font-medium">{user.name}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link 
                          href="/customer" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Meu Perfil
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
            <Link href="/login">
                  <Button className="bg-[#3e2626] hover:bg-[#8B4513] text-white">
                    Entrar
              </Button>
            </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-[#3e2626]"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="text-[#3e2626] font-medium">Início</Link>
                <Link href="/products" className="text-gray-600 hover:text-[#3e2626]">Produtos</Link>
                <Link href="/ai-tools" className="text-gray-600 hover:text-[#3e2626]">IA Decoradora</Link>
                <Link href="/about" className="text-gray-600 hover:text-[#3e2626]">Sobre</Link>
                <Link href="/contact" className="text-gray-600 hover:text-[#3e2626]">Contato</Link>
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar móveis..."
                    className="pl-10 bg-gray-50 border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#3e2626] to-[#8B4513] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Decore seu Espaço com 
                <span className="text-[#D2B48C]"> Móveis Estilosos</span>
                  </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Transforme sua casa com nossa IA Decoradora. Visualize móveis no seu ambiente real antes de comprar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-white text-[#3e2626] hover:bg-gray-100 font-semibold">
                    Explorar Produtos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/ai-tools">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#3e2626] font-semibold">
                    <Camera className="mr-2 h-5 w-5" />
                    IA Decoradora
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-2xl">
                  <div className="aspect-square bg-gradient-to-br from-[#D2B48C] to-[#8B4513] rounded-lg mb-4 flex items-center justify-center">
                    <Sofa className="h-24 w-24 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#3e2626] mb-2">Visualização com IA</h3>
                  <p className="text-gray-600 text-sm">Veja como os móveis ficam no seu ambiente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3e2626] rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#3e2626] mb-2">Frete Grátis</h3>
              <p className="text-gray-600 text-sm">Para compras acima de R$ 500</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#8B4513] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#3e2626] mb-2">Pagamento Seguro</h3>
              <p className="text-gray-600 text-sm">Suas informações protegidas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D2B48C] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#3e2626] mb-2">Entrega Rápida</h3>
              <p className="text-gray-600 text-sm">Receba em até 7 dias úteis</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3e2626] rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#3e2626] mb-2">Melhores Preços</h3>
              <p className="text-gray-600 text-sm">Garantia de preço competitivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3e2626] mb-4">
              Nossas Categorias
            </h2>
            <p className="text-xl text-gray-600">
              Encontre o móvel perfeito para cada ambiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gray-50 hover:bg-white cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-[#3e2626] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#8B4513] transition-colors">
                      <category.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#3e2626] mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600">{category.count} produtos</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3e2626] mb-4">
              Móveis em Destaque
            </h2>
            <p className="text-xl text-gray-600">
              Produtos selecionados especialmente para você
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden">
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-[#D2B48C] to-[#8B4513] flex items-center justify-center">
                    <Sofa className="h-24 w-24 text-white" />
                  </div>
                  {product.badge && (
                    <Badge className="absolute top-4 left-4 bg-[#8B4513] text-white">
                      {product.badge}
                    </Badge>
                  )}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="bg-white/90 hover:bg-white text-[#3e2626]">
                      <Heart className="h-4 w-4" />
                    </Button>
              </div>
            </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      ({product.reviews})
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#3e2626] mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-[#3e2626]">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <Button className="bg-[#3e2626] hover:bg-[#8B4513] text-white">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                  </CardContent>
                </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white">
                Ver Todos os Produtos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#3e2626] mb-6">
                Nova Coleção com IA Decoradora
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Use nossa tecnologia de inteligência artificial para visualizar móveis no seu ambiente real. 
                Tire uma foto do seu espaço e veja como os móveis ficam antes de comprar.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#8B4513]" />
                  <span className="text-gray-700">Visualização em tempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#8B4513]" />
                  <span className="text-gray-700">Múltiplas opções de móveis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#8B4513]" />
                  <span className="text-gray-700">Resultados em segundos</span>
                </div>
              </div>
              <Link href="/ai-tools">
                <Button size="lg" className="bg-[#3e2626] hover:bg-[#8B4513] text-white">
                  <Camera className="mr-2 h-5 w-5" />
                  Experimentar IA Decoradora
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 bg-gray-50">
                  <div className="aspect-square bg-gradient-to-br from-[#D2B48C] to-[#8B4513] rounded-lg flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-[#3e2626] mb-2">
                      Cadeira {i}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#3e2626]">
                        R$ {[899, 1299, 799][i-1]}
                      </span>
                      <Button size="sm" className="bg-[#3e2626] hover:bg-[#8B4513] text-white">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3e2626] mb-4">
              Depoimentos dos Nossos Clientes
            </h2>
            <p className="text-xl text-gray-600">
              Veja o que nossos clientes falam sobre nós
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-0 bg-white shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#3e2626] rounded-full flex items-center justify-center mr-4">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#3e2626]">{testimonial.name}</h4>
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-[#3e2626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Mantenha-se Atualizado
              </h2>
              <p className="text-xl text-gray-200 mb-8">
                Receba ofertas exclusivas e novidades sobre nossos produtos
              </p>
              <div className="flex space-x-4">
                <Input
                  placeholder="Seu melhor e-mail"
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
                <Button className="bg-white text-[#3e2626] hover:bg-gray-100 font-semibold">
                  Inscrever
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-2xl">
                  <div className="aspect-square bg-gradient-to-br from-[#D2B48C] to-[#8B4513] rounded-lg flex items-center justify-center">
                    <Mail className="h-24 w-24 text-white" />
          </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#3e2626] rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">MobiliAI</span>
              </div>
              <p className="text-gray-400 mb-4">
                Transforme sua casa com móveis inteligentes e tecnologia de IA.
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800">
                  <Twitter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">Sobre Nós</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contato</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Carreiras</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link href="/shipping" className="hover:text-white transition-colors">Informações de Envio</Link></li>
                <li><Link href="/returns" className="hover:text-white transition-colors">Devoluções</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
                </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Baixe Nossa App</h3>
              <p className="text-gray-400 mb-4">
                Disponível para iOS e Android
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full border-gray-600 text-gray-400 hover:bg-gray-800">
                  App Store
                </Button>
                <Button variant="outline" className="w-full border-gray-600 text-gray-400 hover:bg-gray-800">
                  Google Play
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MobiliAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}