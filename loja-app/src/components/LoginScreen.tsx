'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, 
  User, 
  ShoppingBag, 
  Palette, 
  Camera,
  MessageCircle,
  Sparkles
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: 'cashier' | 'customer') => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Store className="h-16 w-16 text-blue-600 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">PintAi</h1>
              <p className="text-xl text-gray-600">Loja de Tintas com IA</p>
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Sistema inteligente para visualização de cores, vendas e gestão de loja. 
            Escolha seu tipo de acesso para começar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Funcionário Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onLogin('cashier')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-fit">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Acesso Funcionário</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Sistema completo de ponto de venda para funcionários da loja
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Ponto de Venda (PDV)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Controle de Estoque</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Relatórios de Vendas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Gestão de Caixa</span>
                </div>
              </div>

              <Button 
                className="w-full mt-6 py-3 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => onLogin('cashier')}
              >
                <User className="mr-2 h-5 w-5" />
                Entrar como Funcionário
              </Button>
            </CardContent>
          </Card>

          {/* Cliente Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onLogin('customer')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Acesso Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Experiência completa de compra com tecnologia de IA
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Visualização de Cores com IA</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Assistente Virtual Inteligente</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Catálogo de Produtos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Compra Online</span>
                </div>
              </div>

              <Button 
                className="w-full mt-6 py-3 text-lg bg-green-600 hover:bg-green-700"
                onClick={() => onLogin('customer')}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Entrar como Cliente
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Funcionalidades Inovadoras
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Palette className="h-6 w-6 text-purple-600" />
              <span className="font-medium text-gray-900">Visualização de Cores</span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="font-medium text-gray-900">Análise de Imagens</span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <span className="font-medium text-gray-900">Assistente IA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
