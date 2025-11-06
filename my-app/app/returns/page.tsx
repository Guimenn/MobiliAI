'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  RotateCcw, 
  Calendar,
  Package,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function ReturnsPage() {
  const returnConditions = [
    {
      title: 'Prazo para Devolução',
      description: 'Você tem até 7 dias corridos, a partir da data de recebimento, para solicitar a troca ou devolução.',
      icon: Calendar
    },
    {
      title: 'Estado do Produto',
      description: 'O produto deve estar em sua embalagem original, sem uso, com todas as etiquetas e acessórios.',
      icon: Package
    },
    {
      title: 'Documentação',
      description: 'É necessário apresentar a nota fiscal ou comprovante de compra para realizar a devolução.',
      icon: FileText
    }
  ];

  const returnSteps = [
    {
      step: 1,
      title: 'Acesse sua conta',
      description: 'Entre em "Meus Pedidos" e selecione o produto que deseja devolver'
    },
    {
      step: 2,
      title: 'Solicite a devolução',
      description: 'Clique em "Solicitar Devolução" e informe o motivo'
    },
    {
      step: 3,
      title: 'Aguarde aprovação',
      description: 'Nossa equipe analisará sua solicitação em até 2 dias úteis'
    },
    {
      step: 4,
      title: 'Envie o produto',
      description: 'Após aprovação, você receberá um código de postagem para envio grátis'
    },
    {
      step: 5,
      title: 'Receba o reembolso',
      description: 'Após recebermos o produto, o reembolso será processado em até 10 dias úteis'
    }
  ];

  return (
    <div className="min-h-screen bg-white page-with-fixed-header">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-[#3e2626] to-[#2a1f1f] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <RotateCcw className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Troca e Devolução
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                Política de troca e devolução sem complicações
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Highlight */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-2">
                  Devolução Grátis
                </h2>
                <p className="text-green-800">
                  Oferecemos devolução grátis para todos os produtos. Você não paga nada para devolver 
                  um item que não atendeu suas expectativas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Condições para Devolução</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {returnConditions.map((condition, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="w-12 h-12 bg-[#3e2626]/10 rounded-lg flex items-center justify-center mb-4">
                  <condition.icon className="h-6 w-6 text-[#3e2626]" />
                </div>
                <h3 className="text-lg font-semibold text-[#3e2626] mb-2">
                  {condition.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {condition.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Como Solicitar Devolução</h2>
          <div className="space-y-6">
            {returnSteps.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-6 bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="w-12 h-12 bg-[#3e2626] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#3e2626] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Info */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Troca de Produto</h2>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <p className="text-gray-700 mb-6">
              Para trocar um produto por outro modelo, tamanho ou cor, siga o mesmo processo de devolução. 
              Após recebermos o produto original, enviaremos o novo produto escolhido.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900">
                    <strong>Importante:</strong> Se o valor do novo produto for maior, você precisará 
                    pagar a diferença. Se for menor, o valor será reembolsado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Info */}
      <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Reembolso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#3e2626] mb-3">Formas de Pagamento</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Cartão de Crédito: até 2 faturas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>PIX: até 1 dia útil</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Boleto: até 10 dias úteis</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#3e2626] mb-3">Prazo de Reembolso</h3>
              <p className="text-gray-700 mb-4">
                O reembolso é processado após recebermos e verificarmos o produto devolvido.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Prazo total:</strong> Até 10 dias úteis após a aprovação da devolução.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

