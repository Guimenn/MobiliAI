"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { customerAPI } from "@/lib/api";
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
    MessageCircle,
    Bell,
    Check,
} from "lucide-react";


export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout, cart } = useAppStore();
    
    // Verifica se está na home page
    const isHomePage = pathname === '/';
    
    // Estados locais para favoritos e carrinho
    const [favoritesCount, setFavoritesCount] = useState(0);
    
    // Calcular total de itens no carrinho (soma das quantidades)
    const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Estados locais
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchOpening, setSearchOpening] = useState(false);
    const [searchClosing, setSearchClosing] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    
    // Estados para notificações
    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'Novo produto disponível',
            message: 'Sofá moderno acabou de chegar na loja!',
            time: '2 minutos atrás',
            read: false,
            type: 'product'
        },
        {
            id: '2',
            title: 'Promoção especial',
            message: 'Desconto de 20% em todos os móveis de madeira',
            time: '1 hora atrás',
            read: false,
            type: 'promotion'
        },
        {
            id: '3',
            title: 'Pedido confirmado',
            message: 'Seu pedido #1234 foi confirmado e está em preparação',
            time: '3 horas atrás',
            read: true,
            type: 'order'
        }
    ]);
    
    // Refs para os dropdowns
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const notificationsDropdownRef = useRef<HTMLDivElement>(null);

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
        setNotificationsOpen(false); // Fechar notificações se estiver aberto
    };

    const handleNotificationsClick = () => {
        setNotificationsOpen(!notificationsOpen);
        setUserDropdownOpen(false); // Fechar dropdown do usuário se estiver aberto
    };

    const markNotificationAsRead = (id: string) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

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

    const goToFAQ = () => {
        router.push('/faq');
    };

    // Buscar total de favoritos quando usuário estiver autenticado
    useEffect(() => {
        const fetchFavoritesCount = async () => {
            if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
                try {
                    const response = await customerAPI.getFavoritesCount();
                    console.log('🔍 Response completa da API:', response);
                    
                    // A API retorna um número direto do Prisma
                    let count = 0;
                    if (typeof response === 'number') {
                        count = response;
                    } else if (response?.data !== undefined && typeof response.data === 'number') {
                        count = response.data;
                    } else if (response?.count !== undefined && typeof response.count === 'number') {
                        count = response.count;
                    } else if (typeof response === 'object' && response !== null) {
                        // Tenta pegar o primeiro valor numérico que encontrar
                        const values = Object.values(response);
                        const numValue = values.find(v => typeof v === 'number');
                        if (numValue !== undefined) {
                            count = numValue as number;
                        }
                    }
                    
                    console.log('✅ Favoritos count processado:', count, '| User:', user?.name, '| Role:', user?.role);
                    setFavoritesCount(count);
                } catch (error: any) {
                    console.error('❌ Erro ao buscar contador de favoritos:', error);
                    console.error('Erro detalhes:', error?.response?.data || error?.message);
                    setFavoritesCount(0);
                }
            } else {
                console.log('⚠️ Usuário não autenticado como CUSTOMER. Auth:', isAuthenticated, 'Role:', user?.role);
                setFavoritesCount(0);
            }
        };

        fetchFavoritesCount();
        
        // Atualizar contador quando a rota mudar (caso o usuário adicione/remova favoritos)
        const interval = setInterval(() => {
            if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
                fetchFavoritesCount();
            }
        }, 5000); // Atualiza a cada 5 segundos

        return () => clearInterval(interval);
    }, [isAuthenticated, user, pathname]);

    // Fechar dropdowns quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };

        if (userDropdownOpen || notificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userDropdownOpen, notificationsOpen]);

    return (
        <header className={`w-full transition-all duration-300 relative z-50 ${
            isHomePage 
                ? 'bg-black/20 backdrop-blur-sm' 
                : 'bg-[#3e2626] border-b border-[#2a1f1f] shadow-md'
        }`}>
          <div className="container mx-auto px-4 h-30 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/logotipos/11.svg"
                alt="MobiliAI"
                width={100}
                height={40}
                className={`h-16 md:h-24 w-auto max-w-none transition-all duration-300 ${
                  isHomePage ? '' : 'brightness-0 invert drop-shadow-lg'
                }`}
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
                         : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                     }`}
                   >
                     <Search className="h-6 w-6" />
                   </button>
                ) : (
                  <div className="flex items-center">
                    <div className={`${
                      isHomePage 
                        ? 'bg-white/10 backdrop-blur-sm border-2 border-white/30' 
                        : 'bg-white/95 backdrop-blur-md border-2 border-white/30 shadow-lg'
                    } rounded-xl px-4 py-2 flex items-center space-x-3 transition-all duration-300 ${searchClosing ? 'opacity-0 scale-95 translate-x-4' : searchOpening ? 'opacity-100 scale-100 translate-x-0 animate-in slide-in-from-right' : 'opacity-100 scale-100 translate-x-0'}`}>
                      <Search className={`h-5 w-5 ${isHomePage ? 'text-white/60' : 'text-[#3e2626]'}`} />
                      <input
                        type="text"
                        placeholder="Buscar móveis..."
                        className={`bg-transparent focus:outline-none w-64 ${
                          isHomePage 
                            ? 'text-white placeholder:text-white/60' 
                            : 'text-[#3e2626] placeholder:text-gray-500'
                        }`}
                        autoFocus
                      />
                      <button 
                        onClick={handleCloseSearch}
                        className={`transition-colors ${
                          isHomePage 
                            ? 'text-white/60 hover:text-white' 
                            : 'text-gray-400 hover:text-[#3e2626]'
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
                     : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                 }`}
               >
                 <Heart className="h-6 w-6" />
                {favoritesCount > 0 ? (
                  <span 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg z-50 pointer-events-none"
                    style={{ lineHeight: '1' }}
                  >
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                ) : null}
              </button>
              
               {/* Notifications Icon */}
               <div className="relative" ref={notificationsDropdownRef}>
                 <button 
                   onClick={handleNotificationsClick}
                   className={`p-2 transition-colors relative ${
                     isHomePage 
                       ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                       : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                   }`}
                 >
                   <Bell className="h-6 w-6" />
                   {unreadCount > 0 && (
                     <span 
                       className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg z-50 pointer-events-none"
                       style={{ lineHeight: '1' }}
                     >
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                 </button>
                 
                 {/* Notifications Dropdown */}
                 {notificationsOpen && (
                   <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[999] animate-in slide-in-from-top-2 duration-200 max-h-[500px] flex flex-col">
                                           {/* Header */}
                      <div className="px-4 py-3 bg-[#3e2626] rounded-t-2xl flex items-center justify-between">
                       <div>
                         <h3 className="text-sm font-bold text-white">Notificações</h3>
                         {unreadCount > 0 && (
                           <p className="text-xs text-white/80">{unreadCount} não lidas</p>
                         )}
                       </div>
                       {unreadCount > 0 && (
                         <button
                           onClick={markAllAsRead}
                           className="text-xs text-white/90 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                         >
                           Marcar todas como lidas
                         </button>
                       )}
                     </div>
                     
                     {/* Notifications List */}
                     <div className="overflow-y-auto flex-1">
                       {notifications.length === 0 ? (
                         <div className="px-4 py-8 text-center">
                           <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                           <p className="text-sm text-gray-500">Nenhuma notificação</p>
                         </div>
                       ) : (
                         <div className="divide-y divide-gray-100">
                           {notifications.map((notification) => (
                             <div
                               key={notification.id}
                               onClick={() => markNotificationAsRead(notification.id)}
                               className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                 !notification.read ? 'bg-blue-50/50' : ''
                               }`}
                             >
                               <div className="flex items-start space-x-3">
                                 <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                   !notification.read ? 'bg-blue-500' : 'bg-transparent'
                                 }`} />
                                 <div className="flex-1 min-w-0">
                                   <p className={`text-sm font-semibold ${
                                     !notification.read ? 'text-gray-900' : 'text-gray-700'
                                   }`}>
                                     {notification.title}
                                   </p>
                                   <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                     {notification.message}
                                   </p>
                                   <p className="text-xs text-gray-400 mt-1">
                                     {notification.time}
                                   </p>
                                 </div>
                                 {notification.read && (
                                   <Check className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>
              
               {/* FAQ Icon */}
               <button 
                 onClick={goToFAQ}
                 className={`p-2 transition-colors ${
                   isHomePage 
                     ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                     : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                 }`}
                 title="Perguntas Frequentes"
               >
                 <MessageCircle className="h-6 w-6" />
               </button>
              
               {/* Account Icon - Sempre visível */}
               <div className="relative user-dropdown-container" ref={userDropdownRef}>
                 <button 
                   onClick={handleUserClick}
                   className={`p-2 transition-colors ${
                     isHomePage 
                       ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                       : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
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
                              <p className="text-xs text-gray-500">{favoritesCount} produtos salvos</p>
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
                     : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                 }`}
               >
                 <ShoppingCart className="h-6 w-6" />
                {cartItemsCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg z-50 pointer-events-none"
                    style={{ lineHeight: '1' }}
                  >
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>


          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden border-t py-4 rounded-lg mt-2 ${
              isHomePage 
                ? 'border-white/20 bg-black/20 backdrop-blur-sm' 
                : 'border-white/20 bg-white/10 backdrop-blur-sm'
            }`}>
              <nav className="flex flex-col space-y-4">
                <Link href="/" className={`font-medium ${isHomePage ? 'text-white' : 'text-white'}`}>Início</Link>
                <Link href="/products" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Produtos</Link>
                <Link href="/furniture-visualizer" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Visualizador IA</Link>
                <Link href="/about" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Sobre</Link>
                <Link href="/contact" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Contato</Link>
              </nav>
              <div className={`mt-4 pt-4 border-t ${isHomePage ? 'border-white/20' : 'border-white/20'}`}>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isHomePage ? 'text-white/60' : 'text-white/60'}`} />
                  <Input
                    placeholder="Buscar móveis..."
                    className={`pl-10 backdrop-blur-sm border text-white placeholder:text-white/60 ${
                      isHomePage 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/10 border-white/20'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        </header>
    );
}