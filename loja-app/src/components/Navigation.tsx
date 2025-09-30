'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  User, 
  LogOut, 
  ShoppingCart, 
  Package, 
  Palette, 
  Home,
  Settings,
  BarChart3,
  Camera,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

interface NavigationProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'cashier' | 'customer';
    storeId?: string;
  } | null;
  cashOpen?: boolean;
  cartCount?: number;
  onLogout: () => void;
  onToggleCash?: () => void;
}

export default function Navigation({ user, cashOpen, cartCount = 0, onLogout, onToggleCash }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isCashier = user.role === 'cashier';
  const isCustomer = user.role === 'customer';

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Store className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">PintAi</h1>
              <p className="text-xs text-gray-600">
                {isCashier ? 'Ponto de Venda' : 'Loja Online'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            
            <Link href="/products" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
              <Package className="h-4 w-4" />
              <span>Produtos</span>
            </Link>
            
            <Link href="/color-visualizer" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
              <Palette className="h-4 w-4" />
              <span>Visualizar Cores</span>
            </Link>
            
            <Link href="/chatbot" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
              <MessageCircle className="h-4 w-4" />
              <span>Assistente IA</span>
            </Link>

            {isCashier && (
              <>
                <Link href="/reports" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>Relatórios</span>
                </Link>
                <Link href="/settings" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </>
            )}
          </div>

          {/* Cart & User Info */}
          <div className="flex items-center space-x-4">
            {/* Cash Status for Cashiers */}
            {isCashier && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Caixa:</span>
                <Badge variant={cashOpen ? "default" : "secondary"}>
                  {cashOpen ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
            )}

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-blue-600">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Link>

            {/* User Info */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {isCashier ? 'Funcionário' : 'Cliente'}
              </p>
            </div>

            {/* Logout Button */}
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className={`w-full h-0.5 bg-gray-600 transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-full h-0.5 bg-gray-600 transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-full h-0.5 bg-gray-600 transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t pt-4 pb-4">
            <div className="space-y-2">
              <Link 
                href="/" 
                className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>
              
              <Link 
                href="/products" 
                className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Package className="h-4 w-4" />
                <span>Produtos</span>
              </Link>
              
              <Link 
                href="/color-visualizer" 
                className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Palette className="h-4 w-4" />
                <span>Visualizar Cores</span>
              </Link>
              
              <Link 
                href="/chatbot" 
                className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Assistente IA</span>
              </Link>

              {isCashier && (
                <>
                  <Link 
                    href="/reports" 
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Relatórios</span>
                  </Link>
                  <Link 
                    href="/settings" 
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
