'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Truck, 
  MapPin,
  Clock,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: 'Entrega Padrão',
      time: '5 a 10 dias úteis',
      price: 'R$ 29,90',
      description: 'Entrega em endereço residencial ou comercial',
      features: ['Rastreamento do pedido', 'Entrega em dias úteis', 'Sem agendamento']
    },
    {
      name: 'Entrega Expressa',
      time: '2 a 5 dias úteis',
      price: 'R$ 49,90',
      description: 'Entrega mais rápida para sua região',
      features: ['Rastreamento em tempo real', 'Prioridade na entrega', 'Notificações por SMS']
    },
    {
      name: 'Retirada na Loja',
      time: 'Pronto para retirada',
      price: 'Grátis',
      description: 'Retire seu pedido em uma de nossas lojas',
      features: ['Sem custo de frete', 'Retirada imediata', 'Atendimento personalizado']
    }
  ];

  const coverageAreas = [
    'Grande São Paulo',
    'Região Metropolitana do Rio de Janeiro',
    'Grande Belo Horizonte',
    'Região Metropolitana de Curitiba',
    'Grande Porto Alegre',
    'Região Metropolitana de Brasília'
  ];

  return (
    <div className="min-h-screen bg-white page-with-fixed-header">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-[#3e2626] to-[#2a1f1f] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Envio e Entrega
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                Informações sobre prazos, valores e formas de entrega
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Opções de Entrega</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shippingOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#3e2626] transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#3e2626]">{option.name}</h3>
                  <div className="text-2xl font-bold text-[#3e2626]">{option.price}</div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{option.time}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                <ul className="space-y-2">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Shipping Info */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#3e2626] text-white rounded-xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <Package className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Frete Grátis</h2>
            </div>
            <p className="text-white/90 text-lg mb-4">
              Compras acima de <strong>R$ 299,90</strong> têm frete grátis para todo o Brasil!
            </p>
            <div className="flex items-center gap-2 text-white/80">
              <CheckCircle className="h-5 w-5" />
              <span>Válido para todas as formas de entrega</span>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Areas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Áreas de Cobertura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverageAreas.map((area, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <MapPin className="h-5 w-5 text-[#3e2626]" />
                <span className="text-gray-700">{area}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Outras regiões:</strong> Entrega disponível para todo o Brasil. 
                  O prazo e valor do frete serão calculados no checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Info */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Acompanhar Pedido</h2>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <p className="text-gray-700 mb-6">
              Após a confirmação do pagamento, você receberá um código de rastreamento por e-mail e SMS.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Pedido Confirmado</h4>
                  <p className="text-gray-600 text-sm">Seu pedido foi recebido e está sendo preparado</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Em Trânsito</h4>
                  <p className="text-gray-600 text-sm">Seu pedido saiu para entrega</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Entregue</h4>
                  <p className="text-gray-600 text-sm">Seu pedido foi entregue com sucesso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

