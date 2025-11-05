'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  CheckCircle,
  Package,
  Home,
  ShoppingCart,
  Mail,
  Phone
} from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'N/A';
  const { clearCart } = useAppStore();

  // Limpar carrinho ao chegar na página de sucesso
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('checkout-selected-products');
      clearCart();
    }
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Ícone de Sucesso */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-[#3e2626] mb-4">
              Pedido Confirmado!
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Obrigado pela sua compra
            </p>
            <p className="text-sm text-gray-500">
              Número do pedido: <span className="font-semibold text-[#3e2626]">{orderId}</span>
            </p>
          </div>

          {/* Card de Confirmação */}
          <Card className="shadow-xl border-2 border-green-200 mb-8">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Seu pedido foi recebido</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Enviaremos um e-mail de confirmação</strong> em breve com os detalhes do seu pedido e informações de rastreamento.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3e2626]/10 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-[#3e2626]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3e2626]">Processamento</p>
                    <p className="text-sm text-gray-600">Seu pedido está sendo processado</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3e2626]/10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-[#3e2626]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3e2626]">Confirmação por E-mail</p>
                    <p className="text-sm text-gray-600">Você receberá um e-mail em breve</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3e2626]/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-[#3e2626]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3e2626]">Rastreamento</p>
                    <p className="text-sm text-gray-600">Acompanhe seu pedido em "Meus Pedidos"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] px-8 py-6 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Home className="h-5 w-5 mr-2" />
              Voltar ao Início
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/products')}
              className="border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-8 py-6 rounded-full font-semibold text-lg transition-all duration-300"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Continuar Comprando
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Precisa de ajuda? Entre em contato conosco
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-4 py-2">
                <Mail className="h-4 w-4 mr-2" />
                suporte@mobiliai.com
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Phone className="h-4 w-4 mr-2" />
                (11) 9999-9999
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

