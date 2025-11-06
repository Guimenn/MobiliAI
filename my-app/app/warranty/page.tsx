'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Wrench
} from 'lucide-react';

export default function WarrantyPage() {
  const warrantyTypes = [
    {
      title: 'Garantia Legal',
      period: '90 dias',
      description: 'Garantia obrigatória prevista no Código de Defesa do Consumidor para defeitos de fabricação.',
      coverage: [
        'Defeitos de fabricação',
        'Falhas de funcionamento',
        'Problemas estruturais'
      ]
    },
    {
      title: 'Garantia Estendida',
      period: '12 meses',
      description: 'Garantia adicional oferecida pela MobiliAI para maior tranquilidade.',
      coverage: [
        'Todos os itens da garantia legal',
        'Desgaste natural prematuro',
        'Assistência técnica especializada'
      ]
    }
  ];

  const warrantySteps = [
    {
      step: 1,
      title: 'Identifique o problema',
      description: 'Verifique se o problema está coberto pela garantia'
    },
    {
      step: 2,
      title: 'Entre em contato',
      description: 'Ligue para nosso suporte ou abra um chamado online'
    },
    {
      step: 3,
      title: 'Envie documentação',
      description: 'Envie fotos do problema e a nota fiscal'
    },
    {
      step: 4,
      title: 'Avaliação técnica',
      description: 'Nossa equipe avaliará o caso em até 5 dias úteis'
    },
    {
      step: 5,
      title: 'Resolução',
      description: 'Reparo, troca ou reembolso conforme o caso'
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
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Garantia
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                Proteção completa para seus móveis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Highlight */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#3e2626] text-white rounded-xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Garantia de 12 Meses</h2>
            </div>
            <p className="text-white/90 text-lg mb-4">
              Todos os nossos produtos vêm com garantia de 12 meses contra defeitos de fabricação 
              e problemas estruturais.
            </p>
            <div className="flex items-center gap-2 text-white/80">
              <CheckCircle className="h-5 w-5" />
              <span>Cobertura completa em todo o Brasil</span>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Tipos de Garantia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warrantyTypes.map((warranty, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#3e2626]">{warranty.title}</h3>
                  <div className="px-4 py-2 bg-[#3e2626] text-white rounded-lg font-semibold">
                    {warranty.period}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{warranty.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Cobre:</p>
                  {warranty.coverage.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warranty Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Como Acionar a Garantia</h2>
          <div className="space-y-6">
            {warrantySteps.map((step) => (
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

      {/* What's Covered */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">O Que Está Coberto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-[#3e2626]">Está Coberto</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Defeitos de fabricação</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Falhas estruturais</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Problemas de funcionamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Desgaste prematuro</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-[#3e2626]">Não Está Coberto</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                  <span>Danos por uso inadequado</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                  <span>Acidentes ou quedas</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                  <span>Modificações não autorizadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                  <span>Desgaste normal pelo uso</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Terms */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#3e2626] mb-8">Termos da Garantia</h2>
          <div className="bg-gray-50 rounded-xl p-8">
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#3e2626] mt-1 flex-shrink-0" />
                <p>
                  A garantia é válida apenas para o comprador original e não é transferível.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#3e2626] mt-1 flex-shrink-0" />
                <p>
                  É necessário apresentar a nota fiscal ou comprovante de compra para acionar a garantia.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#3e2626] mt-1 flex-shrink-0" />
                <p>
                  A garantia cobre apenas defeitos de fabricação e não cobre desgaste normal pelo uso.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#3e2626] mt-1 flex-shrink-0" />
                <p>
                  Em caso de reparo, o produto será consertado ou substituído conforme avaliação técnica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

