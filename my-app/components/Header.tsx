"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PromotionalSection from "@/components/PromotionalSection";
import Footer from "@/components/Footer";
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
    Paintbrush,
    Wand2,
    Users,
    Table,
    Plus,
    Minus,
    Filter,
    Grid,
    List,
    LogOut,
    ChevronDown,
    Upload,
    Eye,
    Download,
    Award,
    Zap,
    Target,
    Lightbulb,
    Brush,
    Droplets,
    Layers,
    Scissors,
    Sofa,
    Lamp,
    BookOpen,
    Package,
    Archive,
    Frame,
    Link as LinkIcon,
} from "lucide-react";


export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAppStore();
    
    // Verifica se está na home page
    const isHomePage = pathname === '/';
    
    // Estados locais para favoritos e carrinho (simulados por enquanto)
    const favorites = [];
    const cartItems = [];
    
    // Estados locais
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchOpening, setSearchOpening] = useState(false);
    const [searchClosing, setSearchClosing] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Ref para o dropdown do usuário
    const userDropdownRef = useRef<HTMLDivElement>(null);

    // Handlers
    const handleOpenSearch = () => {
        setSearchOpening(true);
        setSearchOpen(true);
        setTimeout(() => setSearchOpening(false), 300);
    };

    const handleCloseSearch = () => {
        setSearchClosing(true);
        setTimeout(() => {
            setSearchOpen(false);
            setSearchClosing(false);
        }, 300);
    };

    const handleUserClick = () => {
        setUserDropdownOpen(!userDropdownOpen);
    };

    const handleLogout = async () => {
        try {
            // Fechar dropdown
            setUserDropdownOpen(false);
            
            // Executar logout do store
            logout();
            
            // Limpar dados do localStorage manualmente para garantir
            if (typeof window !== 'undefined') {
                localStorage.removeItem('mobili-ai-storage');
                // Limpar outros possíveis dados de sessão
                localStorage.removeItem('supabase.auth.token');
                sessionStorage.clear();
            }
            
            // Redirecionar para home
            router.push('/');
            
            // Forçar reload da página para garantir limpeza completa
            setTimeout(() => {
                window.location.reload();
            }, 100);
            
        } catch (error) {
            console.error('Erro durante logout:', error);
            // Mesmo com erro, tentar limpar e redirecionar
            logout();
            router.push('/');
        }
    };

    const handleCartClick = () => {
        router.push('/cart');
    };

    const goToFavorites = () => {
        router.push('/favorites');
    };

    // Fechar dropdown quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
        };

        if (userDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userDropdownOpen]);

    return (
        <header className={`w-full transition-all duration-300 relative z-50 ${
            isHomePage 
                ? 'bg-black/20 backdrop-blur-sm' 
                : 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm'
        }`}>
          <div className="container mx-auto px-4 h-30 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/logoCompleta.svg"
                alt="MobiliAI"
                width={100}
                height={40}
                className="h-16 md:h-24 w-auto max-w-none"
              />
            </Link>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-6">
               {/* Search Icon with Animation */}
               <div className="relative search-icon-container">
                 {!searchOpen ? (
                   <button 
                     onClick={handleOpenSearch}
                     className={`p-2 transition-colors ${
                       isHomePage 
                         ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                         : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full'
                     }`}
                   >
                     <Search className="h-6 w-6" />
                   </button>
                ) : (
                  <div className="flex items-center">
                    <div className={`${
                      isHomePage 
                        ? 'bg-white/10 backdrop-blur-sm border-2 border-white/30' 
                        : 'bg-white border-2 border-gray-200 shadow-lg'
                    } rounded-xl px-4 py-2 flex items-center space-x-3 transition-all duration-300 ${searchClosing ? 'opacity-0 scale-95 translate-x-4' : searchOpening ? 'opacity-100 scale-100 translate-x-0 animate-in slide-in-from-right' : 'opacity-100 scale-100 translate-x-0'}`}>
                      <Search className={`h-5 w-5 ${isHomePage ? 'text-white/60' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        placeholder="Buscar móveis..."
                        className={`bg-transparent focus:outline-none w-64 ${
                          isHomePage 
                            ? 'text-white placeholder:text-white/60' 
                            : 'text-gray-900 placeholder:text-gray-500'
                        }`}
                        autoFocus
                      />
                      <button 
                        onClick={handleCloseSearch}
                        className={`transition-colors ${
                          isHomePage 
                            ? 'text-white/60 hover:text-white' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
               {/* Favorites Icon */}
               <button 
                 onClick={goToFavorites}
                 className={`p-2 transition-colors relative ${
                   isHomePage 
                     ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full'
                 }`}
               >
                 <Heart className="h-6 w-6" />
                {favorites.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {favorites.length}
                  </Badge>
                )}
              </button>
              
               {/* Account Icon - Sempre visível */}
               <div className="relative user-dropdown-container" ref={userDropdownRef}>
                 <button 
                   onClick={handleUserClick}
                   className={`p-2 transition-colors ${
                     isHomePage 
                       ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full'
                   }`}
                 >
                   <User className="h-6 w-6" />
                 </button>
                
                {/* Dropdown - Diferente para usuário autenticado vs não autenticado */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-[999] animate-in slide-in-from-top-2 duration-200">
                    {isAuthenticated ? (
                      <>
                        {/* Header com informações do usuário */}
                        <div className="px-4 py-3 bg-gray-50 rounded-t-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#5a3a3a] rounded-full flex items-center justify-center shadow-lg">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">{user?.name || 'Usuário'}</p>
                              <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botões de ação para usuário autenticado */}
                        <div className="px-1 py-1">
                          <Link 
                            href="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#3e2626]/5 hover:to-[#5a3a3a]/5 rounded-lg transition-all duration-200 group"
                          >
                            <div className="w-7 h-7 bg-[#3e2626]/10 rounded-lg flex items-center justify-center group-hover:bg-[#3e2626]/20 transition-colors">
                              <User className="h-4 w-4 text-[#3e2626]" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Meu Perfil</p>
                              <p className="text-xs text-gray-500">Editar informações</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3e2626] transition-colors" />
                          </Link>
                          
                          <Link 
                            href="/favorites"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#3e2626]/5 hover:to-[#5a3a3a]/5 rounded-lg transition-all duration-200 group"
                          >
                            <div className="w-7 h-7 bg-[#3e2626]/10 rounded-lg flex items-center justify-center group-hover:bg-[#3e2626]/20 transition-colors">
                              <Heart className="h-4 w-4 text-[#3e2626]" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Meus Favoritos</p>
                              <p className="text-xs text-gray-500">{favorites.length} produtos salvos</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3e2626] transition-colors" />
                          </Link>
                          
                          <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                          
                          <button 
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-lg transition-all duration-200 w-full text-left group"
                          >
                            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                              <LogOut className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Sair</p>
                              <p className="text-xs text-red-500">Fazer logout</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Header para usuário não autenticado */}
                        <div className="px-4 py-3 bg-gradient-to-r from-[#3e2626]/5 to-[#5a3a3a]/5 rounded-t-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626]/20 to-[#5a3a3a]/20 rounded-full flex items-center justify-center shadow-lg">
                                <User className="h-5 w-5 text-[#3e2626]" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">Olá! 👋</p>
                              <p className="text-xs text-gray-500">Faça login para continuar</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Conteúdo para usuário não autenticado */}
                        <div className="px-1 py-1">
                          <div className="px-3 py-4 text-center">
                            <p className="text-sm text-gray-600 mb-4">
                              Entre na sua conta para acessar seus favoritos, histórico de compras e muito mais!
                            </p>
                            <Link 
                              href="/login"
                              onClick={() => setUserDropdownOpen(false)}
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3e2626] hover:bg-[#5a3a3a] text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <User className="h-4 w-4" />
                              <span>Entrar</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
               </div>
              
               {/* Cart Icon */}
               <button 
                 onClick={handleCartClick}
                 className={`p-2 transition-colors relative ${
                   isHomePage 
                     ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full'
                 }`}
               >
                 <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className={`absolute -top-1 -right-1 text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                    isHomePage 
                      ? 'bg-white text-[#3e2626]' 
                      : 'bg-[#3e2626] text-white'
                  }`}>
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>


          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-4 bg-black/20 backdrop-blur-sm rounded-lg mt-2">
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="text-white font-medium">Início</Link>
                <Link href="/products" className="text-white/80 hover:text-white">Produtos</Link>
                <Link href="/furniture-visualizer" className="text-white/80 hover:text-white">Visualizador IA</Link>
                <Link href="/about" className="text-white/80 hover:text-white">Sobre</Link>
                <Link href="/contact" className="text-white/80 hover:text-white">Contato</Link>
              </nav>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                  <Input
                    placeholder="Buscar móveis..."
                    className="pl-10 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        </header>
    );
}