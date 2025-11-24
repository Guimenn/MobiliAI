'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Building2,
  Target,
  Users,
  Award,
  Heart,
  Sparkles,
  Palette,
  Camera,
  Wand2,
  CheckCircle,
  TrendingUp,
  Globe,
  Lightbulb,
  Shield,
  Clock,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Paixão por Design',
      description: 'Acreditamos que cada ambiente merece ser único e refletir a personalidade de quem o habita.'
    },
    {
      icon: Sparkles,
      title: 'Inovação Tecnológica',
      description: 'Utilizamos inteligência artificial para transformar a experiência de compra de móveis.'
    },
    {
      icon: Shield,
      title: 'Qualidade Garantida',
      description: 'Trabalhamos apenas com produtos de alta qualidade e fornecedores confiáveis.'
    },
    {
      icon: Users,
      title: 'Foco no Cliente',
      description: 'Seu sonho é nossa prioridade. Estamos sempre prontos para ajudar você a criar o ambiente perfeito.'
    }
  ];

  const features = [
    {
      icon: Camera,
      title: 'Visualização com IA',
      description: 'Envie uma foto do seu ambiente e veja como os móveis ficarão antes de comprar.'
    },
    {
      icon: Palette,
      title: 'Paletas Personalizadas',
      description: 'Nossa IA sugere combinações de cores e estilos harmoniosos para seu espaço.'
    },
    {
      icon: Wand2,
      title: 'Assistente Virtual',
      description: 'Conte com nosso chatbot inteligente para tirar dúvidas e receber recomendações.'
    },
    {
      icon: Globe,
      title: 'Múltiplas Lojas',
      description: 'Atendemos em várias cidades com lojas físicas e entrega em todo o Brasil.'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Clientes Satisfeitos', icon: Users },
    { number: '50K+', label: 'Produtos Vendidos', icon: Award },
    { number: '15+', label: 'Anos de Experiência', icon: Clock },
    { number: '4.8', label: 'Avaliação Média', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-42">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3e2626] rounded-2xl mb-6">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3e2626] mb-4">
            Sobre Nós
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transformando sonhos em realidade através de móveis inteligentes e tecnologia de ponta
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 text-center hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#3e2626] mb-1">{stat.number}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Our Story Section */}
        <Card className="mb-16 border-2 border-[#3e2626]/10 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-[#3e2626]">Nossa História</CardTitle>
                <CardDescription className="text-lg">Como tudo começou</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                A <strong className="text-[#3e2626]">MobiliAI</strong> nasceu da paixão por design de interiores e da 
                necessidade de tornar a experiência de compra de móveis mais intuitiva e personalizada. 
                Fundada em 2009, nossa empresa sempre esteve na vanguarda da tecnologia aplicada ao varejo.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Em 2020, demos um grande passo ao integrar inteligência artificial ao nosso processo de vendas. 
                Desenvolvemos uma plataforma única que permite aos clientes visualizar móveis em seus próprios 
                ambientes antes mesmo de fazer a compra, eliminando a incerteza e aumentando a satisfação.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Hoje, somos referência no mercado de móveis com tecnologia IA, atendendo milhares de clientes 
                em todo o Brasil através de nossas lojas físicas e plataforma online. Nossa missão continua sendo 
                a mesma: ajudar você a criar o ambiente dos seus sonhos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-2 border-[#3e2626]/10 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="h-6 w-6 text-[#3e2626]" />
                <CardTitle className="text-xl font-bold text-[#3e2626]">Nossa Missão</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">
                Transformar a experiência de compra de móveis através de tecnologia inovadora, 
                oferecendo produtos de qualidade e um atendimento excepcional que supera as expectativas 
                dos nossos clientes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#3e2626]/10 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10">
              <div className="flex items-center space-x-3 mb-2">
                <Lightbulb className="h-6 w-6 text-[#3e2626]" />
                <CardTitle className="text-xl font-bold text-[#3e2626]">Nossa Visão</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">
                Ser a principal referência em móveis com tecnologia IA na América Latina, 
                reconhecida pela inovação, qualidade e compromisso com a satisfação do cliente.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#3e2626] mb-3">Nossos Valores</h2>
            <p className="text-gray-600 text-lg">Os princípios que guiam tudo o que fazemos</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-2 border-[#3e2626]/10 hover:shadow-xl transition-all hover:border-[#3e2626]/30">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#2a1a1a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#3e2626] mb-3">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#3e2626] mb-3">O Que Nos Diferencia</h2>
            <p className="text-gray-600 text-lg">Tecnologia de ponta ao seu alcance</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 border-[#3e2626]/10 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-[#3e2626] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#3e2626] mb-2">{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="border-2 border-[#3e2626]/10 shadow-lg bg-gradient-to-br from-[#3e2626]/5 to-white">
          <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl">
            <CardTitle className="text-2xl font-bold text-[#3e2626] text-center">
              Por Que Escolher a MobiliAI?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Visualização Realista</h4>
                  <p className="text-gray-600 text-sm">Veja exatamente como os móveis ficarão no seu ambiente antes de comprar.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Atendimento Personalizado</h4>
                  <p className="text-gray-600 text-sm">Nossa IA e equipe estão sempre prontas para ajudar você.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Qualidade Garantida</h4>
                  <p className="text-gray-600 text-sm">Trabalhamos apenas com produtos de alta qualidade e fornecedores confiáveis.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Frete Grátis</h4>
                  <p className="text-gray-600 text-sm">Compras acima de R$ 299,90 têm frete grátis para todo o Brasil.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Parcelamento Sem Juros</h4>
                  <p className="text-gray-600 text-sm">Parcelamento em até 12x sem juros no cartão de crédito.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#3e2626] mb-1">Garantia de 12 Meses</h4>
                  <p className="text-gray-600 text-sm">Todos os produtos têm garantia de fábrica contra defeitos.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-[#3e2626] to-[#2a1a1a] text-white border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto mb-6 text-white/90" />
            <h2 className="text-3xl font-bold mb-4">Pronto para Transformar Seu Espaço?</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Explore nossa coleção de móveis e use nossa tecnologia de IA para visualizar 
              como ficarão no seu ambiente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#3e2626] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Ver Produtos
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Entre em Contato
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

