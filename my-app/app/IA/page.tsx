'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Download,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Palette,
  Lightbulb,
  Star,
  Rocket,
  Cpu,
  Eye,
  Package,
  Quote,
  Globe,
  Layers,
  Brush,
  MessageCircle,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import BlurText from '@/components/ui/shadcn-io/blur-text';
import { Marquee, MarqueeContent, MarqueeItem } from '@/components/ui/shadcn-io/marquee';
import { CardContainer, CardBody, CardItem } from '@/components/ui/shadcn-io/3d-card';
import { FlipWords } from '@/components/ui/shadcn-io/flip-words';
import { TextRevealButton } from '@/components/ui/shadcn-io/text-reveal-button';
import CTA from "@/components/ui/CTA"

// Tipos para os dados do banco
interface TransformationItem {
  title: string;
  description: string;
  src: string;
}

interface MoodboardItem {
  image: string;
  label: string;
  headline: string;
  description: string;
  quote: string;
  author: string;
}

interface TrendItem {
  title: string;
  tag: string;
  image: string;
  bulletPoints: string[];
}

interface ProductItem {
  name: string;
  description: string;
  src: string;
  category: string;
}

export default function TestIALandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [referenceIndex, setReferenceIndex] = useState(0);
  const [trendIndex, setTrendIndex] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(0);
  
  // Estados para dados do banco
  const [transformationGallery, setTransformationGallery] = useState<TransformationItem[]>([]);
  const [referenceMoodboards, setReferenceMoodboards] = useState<MoodboardItem[]>([]);
  const [trendCarrousel, setTrendCarrousel] = useState<TrendItem[]>([]);
  const [productShowcase, setProductShowcase] = useState<ProductItem[]>([]);
  
   // Dados estáticos (podem ser movidos para o banco depois)
   const differentiators = [
     {
       icon: <Cpu className="h-7 w-7" />,
       title: 'IA que funciona na prática',
       description: 'Processa imagens e identifica padrões automaticamente, sem complicação.',
     },
     {
       icon: <Zap className="h-7 w-7" />,
       title: 'Resultados rápidos',
       description: 'Em poucos segundos você já vê o resultado final.',
     },
     {
       icon: <Package className="h-7 w-7" />,
       title: 'Integração com seu sistema',
       description: 'Conecta direto com seu catálogo de produtos e estoque.',
     },
     {
       icon: <ShieldCheck className="h-7 w-7" />,
       title: 'Fácil de usar',
       description: 'Interface simples e intuitiva. Qualquer pessoa da equipe consegue usar.',
     },
   ];

   const timeline = [
     {
       step: '1',
       title: 'Envie a foto',
       description: 'Faça upload da imagem do ambiente que deseja transformar.',
     },
     {
       step: '2',
       title: 'Escolha a mobília',
       description: 'Selecione a mobília que deseja usar no ambiente.',
     },
     {
       step: '3',
       title: 'A IA processa',
       description: 'A IA aplica as transformações automaticamente.',
     },
     {
       step: '4',
       title: 'Visualize e compartilhe',
       description: 'Veja o resultado e compartilhe com seus clientes.',
     },
   ];

  const impactPhrases = [
    {
      title: '3x mais conversões',
      subtitle: 'Clientes que visualizam antes de comprar convertem 3x mais.',
    },
    {
      title: '50% menos retrabalho',
      subtitle: 'Redução significativa em ajustes e retoques após a obra.',
    },
    {
      title: '100% satisfação',
      subtitle: 'Clientes aprovam projetos antes mesmo de começar a pintura.',
    },
  ];

  const heroMetrics = [
    {
      value: '12s',
      label: 'tempo médio',
      description: 'para aplicar uma nova paleta completa com IA',
    },
    {
      value: '98%',
      label: 'fidelidade cromática',
      description: 'comparada ao catálogo físico das lojas',
    },
    {
      value: '+42',
      label: 'kits sugeridos',
      description: 'por sessão combinando tintas e acessórios',
    },
  ];

  const immersiveHighlights = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Studio omnicanal',
      description: 'Compartilhe o preview via link, QR Code, WhatsApp ou totens de autoatendimento.',
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: 'Comparador interativo',
      description: 'Slider antes/depois respeitando textura, profundidade e iluminação do ambiente.',
    },
    {
      icon: <Brush className="h-6 w-6" />,
      title: 'Checklist automático',
      description: 'IA lista tintas, primers e acessórios correspondentes ao render aprovado.',
    },
  ];

  const useCaseTabs = [
    {
      title: 'Equipe de loja',
      badge: 'Ponto de venda',
      description: 'Transforme cada atendimento em consultoria visual com recomendações prontas.',
      bullets: [
        'Simulador otimizado para tablets e totens com o mesmo layout responsivo.',
        'Checklist automático envia a lista de produtos direto para o caixa.',
        'Histórico da sessão fica salvo no CRM para futuras campanhas.',
      ],
      ctaLabel: 'Ativar no PDV',
      ctaHref: '/stores',
      secondaryLabel: 'Baixar guia rápido',
      secondaryHref: '/help',
      image: '/IAsection/ImagemIA4.png',
    },
    {
      title: 'Arquiteto parceiro',
      badge: 'Projetos B2B',
      description: 'Ofereça pacotes exclusivos com renderizações aprovadas em tempo recorde.',
      bullets: [
        'Integração com moodboards e bibliotecas compartilhadas com o time criativo.',
        'Versões comentadas com notas técnicas e orçamentos sugeridos.',
        'Exportação com watermark e carimbo automático de simulação.',
      ],
      ctaLabel: 'Convidar arquitetos',
      ctaHref: '/manager/partners',
      secondaryLabel: 'Ver contrato modelo',
      secondaryHref: '/terms',
      image: '/IAsection/ImagemIA2.png',
    },
    {
      title: 'Cliente final',
      badge: 'Autoatendimento',
      description: 'Deixe o consumidor experimentar, salvar favoritos e fechar pedido no mesmo fluxo.',
      bullets: [
        'Assistente sugere paletas complementares com base no estilo selecionado.',
        'Comparativo de consumo estimado por metro quadrado e acabamentos.',
        'Checkout integrado com PIX e kits complementares recomendados.',
      ],
      ctaLabel: 'Liberar experiência completa',
      ctaHref: '/IA-demo',
      secondaryLabel: 'Ver histórias reais',
      secondaryHref: '/products',
      image: '/IAsection/ImagemIA3.png',
    },
  ];

  const assistantHighlights = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Chat co-criativo',
      description: 'Prompts naturais com memória compartilhada entre vendedor e cliente.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Governança garantida',
      description: 'Todas as renderizações levam aviso de simulação e log completo em auditoria.',
    },
    {
      icon: <Headphones className="h-5 w-5" />,
      title: 'Onboarding guiado',
      description: 'Biblioteca de scripts, vídeos e scripts de atendimento para cada loja.',
    },
  ];

  const faqItems = [
    {
      question: 'Posso usar a IA mesmo com fotos amadoras?',
      answer: 'Sim. O motor detecta profundidade e corrige ruídos de iluminação antes de aplicar as novas cores.',
    },
    {
      question: 'As renderizações ficam salvas onde?',
      answer: 'Tudo fica centralizado no MobiliAI Studio com controle de permissões por loja e equipe.',
    },
    {
      question: 'Quais dispositivos são suportados?',
      answer: 'Desktop, tablets iOS/Android e totens web. O layout adapta automaticamente aos tamanhos.',
    },
    {
      question: 'Preciso treinar o time?',
      answer: 'Oferecemos onboarding remoto, scripts prontos e suporte dedicado durante o lançamento.',
    },
  ];

  // Buscar dados do banco
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar transformações
        const transformationsRes = await fetch('/api/landing/transformations');
        const transformations = await transformationsRes.json();
        setTransformationGallery(transformations);

        // Buscar moodboards
        const moodboardsRes = await fetch('/api/landing/moodboards');
        const moodboards = await moodboardsRes.json();
        setReferenceMoodboards(moodboards);

        // Buscar tendências
        const trendsRes = await fetch('/api/landing/trends');
        const trends = await trendsRes.json();
        setTrendCarrousel(trends);

        // Buscar produtos
        const productsRes = await fetch('/api/landing/products');
        const products = await productsRes.json();
        setProductShowcase(products);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: <Sparkles className="h-7 w-7" />,
      title: 'Composição inteligente',
      description: 'Integra móveis, iluminação e sombras automaticamente para resultados naturais.',
      gradient: 'from-[#3e2626] via-[#6b3c27] to-[#C07A45]',
    },
    {
      icon: <Wand2 className="h-7 w-7" />,
      title: 'Auto posicionamento',
      description: 'Ajuste de escala, perspectiva e alinhamento em segundos com nano-banana AI.',
      gradient: 'from-[#8B4513] via-[#C07A45] to-[#F7C194]',
    },
    {
      icon: <Eye className="h-7 w-7" />,
      title: 'Visualização realista',
      description: 'Pré-visualizações em alta definição para tomar decisões com confiança.',
      gradient: 'from-[#3e2626] via-[#5e3a26] to-[#8B4513]',
    },
    {
      icon: <Download className="h-7 w-7" />,
      title: 'Exportação instantânea',
      description: 'Salve e compartilhe versões finais com aviso de simulação por IA.',
      gradient: 'from-[#C07A45] via-[#F0B27A] to-[#F7D1B1]',
    },
  ];

  const handleReferenceNav = (direction: 'prev' | 'next') => {
    if (referenceMoodboards.length === 0) return;
    setReferenceIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? referenceMoodboards.length - 1 : prev - 1;
      }
      return prev === referenceMoodboards.length - 1 ? 0 : prev + 1;
    });
  };

  const handleTrendNav = (direction: 'prev' | 'next') => {
    if (trendCarrousel.length === 0) return;
    setTrendIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? trendCarrousel.length - 1 : prev - 1;
      }
      return prev === trendCarrousel.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative overflow-hidden min-h-screen flex items-center pt-20 ">
          {/* Background Image com efeitos dinâmicos */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-out z-0"
            style={{ 
              backgroundImage: 'url(/hero-bg.png)',
              filter: 'sepia(40%) saturate(60%) brightness(0.5) contrast(1.1) hue-rotate(-10deg)',
              WebkitFilter: 'sepia(40%) saturate(60%) brightness(0.5) contrast(1.1) hue-rotate(-10deg)',
              transform: 'scale(1.1)'
            }}
          ></div>
          
          {/* Overlay gradiente marrom elegante */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3e2626]/85 via-[#5a3a3a]/70 to-[#3e2626]/60"></div>
          
          {/* Overlay adicional para dar profundidade marrom */}
          <div className="absolute inset-0 bg-[#3e2626]/30 mix-blend-multiply"></div>
          
          {/* Efeitos de luz animados com tons marrons */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8B4513]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3e2626]/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          {/* Grid pattern sutil com tons marrons */}
          <div 
            className="absolute inset-0 opacity-[0.08] z-0"
            style={{
              backgroundImage: `linear-gradient(rgba(139, 69, 19, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 69, 19, 0.15) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          ></div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[90vh]">
              
              {/* LADO ESQUERDO - Conteúdo principal */}
              <div className="text-white space-y-10 mt-10">
               

                {/* Título principal */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="space-y-4"
                >
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
                    <span className="block text-white drop-shadow-2xl">
                      Visualize
                    </span>
                    <span className="block text-white drop-shadow-2xl">
                      ambientes reais
                    </span>
                    <span className="block text-white drop-shadow-2xl mt-2 md:mt-3">
                      <span className="text-white">com mobilias </span>
                      <FlipWords
                        words={[ 'personalizadas.', 'exclusivas.', 'únicas.']}
                        duration={3000}
                        className="text-[#C3A580]"
                      />
                    </span>
                  </h1>
                </motion.div>

                {/* Botões */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  <Link href="/IA-demo">
                    <Button 
                      size="lg"
                      className="group relative bg-white text-[#3e2626] hover:bg-white/95 rounded-full px-10 py-7 text-base font-bold transition-all duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      <span className="relative flex items-center gap-3">
                        <Rocket className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                        <span>EXPERIMENTAR AGORA</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button 
                      size="lg"
                      variant="outline"
                      className="group relative bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white/70 rounded-full px-10 py-7 text-base font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <span className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                        <span>VER CATÁLOGO</span>
                      </span>
                    </Button>
                  </Link>
                </motion.div>

                {/* Métricas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="grid grid-cols-3 gap-4 pt-6"
                >
                  {heroMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-lg hover:bg-white/15 transition-all duration-300"
                    >
                      <p className="text-3xl md:text-4xl font-black text-white">{metric.value}</p>
                      <p className="mt-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* LADO DIREITO - Imagem destacada */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative group w-full"
              >
                <div className="relative bg-gradient-to-br from-white/15 h-[550px] via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-2 border-white/40 overflow-hidden transition-all duration-500 hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] hover:border-white/50 hover:scale-[1.01]">
                  {/* Efeito de brilho animado no fundo */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
                  </div>
                  
                  {/* Padrão decorativo sutil de fundo */}
                  <div className="absolute inset-0 opacity-[0.08]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                  
                  {/* Imagem principal */}
                  <div className="relative h-full w-full rounded-2xl overflow-hidden">
                    <Image
                      src="/IAsection/ImagemIA3.png"
                      alt="Visualização de quarto gerada pela IA"
                      fill
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 1024px) 100vw, 500px"
                      priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#3e2626]/40 via-transparent to-transparent" />
                  </div>
                  
                  {/* Badge na imagem */}
                  <div className="absolute top-8 left-8 inline-flex items-center gap-2 rounded-full bg-[#3e2626]/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur-sm border border-white/20">
                   
                    IA aplicada
                  </div>
                </div>
                
                {/* Card flutuante com resultado */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute -bottom-6 -right-6 hidden w-64 rounded-3xl bg-[#3e2626] p-5 shadow-2xl backdrop-blur-lg border border-white/10 md:block"
                >
                  <div className="relative h-32 overflow-hidden rounded-2xl mb-3">
                    <Image 
                      src="/IAsection/ImagemIA1.png" 
                      alt="Renderização de sala pela IA" 
                      fill 
                      className="object-cover" 
                      sizes="256px" 
                    />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80 mb-1">Resultado em 12s</p>
                  <p className="text-sm text-white/90 leading-snug">IA posicionou paleta e mobiliário da coleção Oslo automaticamente.</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

       

        {/* Highlights */}
        <section className="relative overflow-hidden bg-white py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Lado esquerdo - Texto e features */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#3e2626] mb-4 tracking-tight">
                    A tecnologia que entende o que você precisa
                  </h2>
                  <p className="text-base md:text-lg text-[#4f3a2f]/80 leading-relaxed font-light">
                    Usamos as mesmas cores do seu catálogo. A IA analisa textura e iluminação para mostrar como fica na prática.
                  </p>
                </div>

                <div className="space-y-5 pt-4">
                  {[
                    {
                      icon: <Lightbulb className="h-5 w-5" />,
                      title: 'Paletas que combinam',
                      description: 'Sugestões baseadas no que já vende na sua loja e no estilo do cliente.',
                    },
                    {
                      icon: <CheckCircle2 className="h-5 w-5" />,
                      title: 'Sem precisar editar depois',
                      description: 'A IA ajusta sombras e perspectiva automaticamente. Você só aprova.',
                    },
                    {
                      icon: <Star className="h-5 w-5" />,
                      title: 'Moodboards prontos',
                      description: 'Renderizações realistas em poucos segundos, prontas para mostrar ao cliente.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 p-5 rounded-2xl border border-[#3e2626]/10 bg-white hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3e2626]/5 text-[#3e2626] mt-0.5">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-[#3e2626] mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#4f3a2f]/70 leading-relaxed font-light">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lado direito - Imagem */}
              <div className="relative">
                <div className="relative h-[480px] lg:h-[560px] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/IAsection/ImagemIA2.png"
                    alt="Sala transformada com IA"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 560px"
                  />
                  
                  {/* Overlay sutil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3e2626]/70 via-transparent to-transparent"></div>
                  
                  {/* Badge simples */}
                  <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#3e2626]">
                   
                    IA aplicada
                  </div>
                  
                  {/* Texto na parte inferior */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-sm md:text-base text-white leading-relaxed font-light max-w-md">
                      Troquei o sofá, coloquei uma luminária e combinei com tapete terracota. Ficou assim.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      

        

       

        {/* Transformation gallery */}
        <section className="relative overflow-hidden bg-white py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-gray-100 via-gray-100/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto px-4 z-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-4xl font-black text-[#3e2626]">Transformações reais</h2>
                <p className="mt-3 max-w-xl text-[#4f3a2f]/75">
                  Cada render abaixo foi gerado com imagens reais do nosso banco e móveis do catálogo oficial.
            </p>
          </div>
              
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {transformationGallery.length > 0 ? transformationGallery.map((item) => (
                <div
                  key={item.title}
                  className="group relative h-72 overflow-hidden rounded-3xl border border-[#3e2626]/10 bg-white shadow-sm"
                >
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className="object-cover object-center transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 280px"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#3e2626]/75 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-xs text-white/80">{item.description}</p>
                  </div>
                </div>
              )              ) : (
                <div className="col-span-full text-center py-12 text-[#4f3a2f]/60">
                  Carregando transformações...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Reference moodboards */}
        <section className="relative overflow-hidden bg-gray-50 py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto flex flex-col gap-12 px-4 lg:flex-row z-20">
            <div className="lg:w-[45%]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#3e2626]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#3e2626]/80">
                Referências reais
              </span>
              <h2 className="mt-6 text-4xl font-black text-[#3e2626]">
                Moodboards que nasceram da IA e viraram vitrines memoráveis.
              </h2>
              <p className="mt-4 text-lg text-[#4f3a2f]/75">
                Consulte o histórico de ambientes aprovados e reaproveite combinações com um clique.
                A cada navegação o simulador sugere uma nova narrativa visual para a sua equipe.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-full border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10"
                  onClick={() => handleReferenceNav('prev')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-full border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10"
                  onClick={() => handleReferenceNav('next')}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <span className="text-sm font-semibold text-[#3e2626]/70">
                  {referenceMoodboards.length > 0 ? `${referenceIndex + 1}/${referenceMoodboards.length}` : '0/0'}
                </span>
              </div>
            </div>

            <div className="relative flex-1">
              {referenceMoodboards.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-[#3e2626]/15 bg-white shadow-xl">
                  <div className="relative h-72 w-full">
                    <Image
                      src={referenceMoodboards[referenceIndex].image}
                      alt={referenceMoodboards[referenceIndex].label}
                      fill
                      className="object-cover object-center"
                    />
                    <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#3e2626]/80">
                      {referenceMoodboards[referenceIndex].label}
                    </div>
                  </div>
                  <div className="space-y-4 p-8">
                    <h3 className="text-2xl font-semibold text-[#3e2626]">
                      {referenceMoodboards[referenceIndex].headline}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#4f3a2f]/75">
                      {referenceMoodboards[referenceIndex].description}
                    </p>
                    
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-72 rounded-3xl border border-[#3e2626]/15 bg-white shadow-xl">
                  <p className="text-[#4f3a2f]/60">Carregando moodboards...</p>
                </div>
              )}
            </div>
          </div>
        </section>

         {/* Immersive studio */}
         <section className="relative overflow-hidden bg-[#3e2626] py-20 text-white">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Imagem */}
              <div className="relative">
                <div className="relative h-[450px] lg:h-[520px] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/IAsection/ImagemIA4.png"
                    alt="Console do estúdio de IA"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 520px"
                  />
                  
                  {/* Overlay sutil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3e2626]/60 via-transparent to-transparent"></div>
                  
                 
                </div>
              </div>

              {/* Conteúdo */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 tracking-tight">
                    Seu showroom dentro do navegador
                  </h2>
                  <p className="text-base md:text-lg text-white/80 leading-relaxed font-light">
                    A mesma experiência da loja física, mas no computador. Teste cores, monte ambientes e compartilhe com o cliente na hora.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {immersiveHighlights.map((item) => (
                    <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white mt-0.5">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium mb-1">{item.title}</h3>
                        <p className="text-sm text-white/75 leading-relaxed font-light">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Link href="/IA-demo">
                    <Button className="h-11 rounded-full bg-white px-6 text-sm font-medium text-[#3e2626] hover:bg-white/95">
                      Abrir estúdio
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-white/30 bg-transparent px-6 text-sm font-medium text-white hover:bg-white/10"
                    >
                      Falar com especialistas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

         {/* Recursos e Fluxo */}
         <section className="relative overflow-hidden bg-gray-50 py-20">
           <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
             <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
               {/* Lado esquerdo - Por que usar */}
               <div>
                 <div className="mb-8">
                   <h2 className="text-2xl md:text-3xl font-bold text-[#3e2626] mb-2">
                     Por que usar MobiliAI
                   </h2>
                   <p className="text-sm text-[#4f3a2f]/70">
                     Ferramentas que facilitam o trabalho no dia a dia da sua loja.
                   </p>
                 </div>

                 <div className="space-y-4">
                   {differentiators.map((item) => (
                     <div
                       key={item.title}
                       className="bg-white p-5 rounded-xl border border-[#3e2626]/10"
                     >
                       <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-lg bg-[#3e2626]/5 text-[#3e2626]">
                           {item.icon}
                         </div>
                         
                         <div className="flex-1">
                           <h3 className="text-base font-medium text-[#3e2626] mb-1.5">
                             {item.title}
                           </h3>
                           <p className="text-sm text-[#4f3a2f]/70 leading-relaxed">
                             {item.description}
                           </p>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Lado direito - Como funciona */}
               <div>
                 <div className="mb-8">
                   <h2 className="text-2xl md:text-3xl font-bold text-[#3e2626] mb-2">
                     Como funciona
                   </h2>
                   <p className="text-sm text-[#4f3a2f]/70">
                     Quatro passos simples para começar
                   </p>
                 </div>
                 
                 <div className="space-y-4">
                   {timeline.map((item) => (
                     <div
                       key={item.step}
                       className="bg-white p-5 rounded-xl border border-[#3e2626]/10"
                     >
                       <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-[#3e2626] text-sm font-medium text-white">
                           {item.step}
                         </div>
                         
                         <div className="flex-1">
                           <h4 className="text-base font-medium text-[#3e2626] mb-1.5">
                             {item.title}
                           </h4>
                           <p className="text-sm text-[#4f3a2f]/70 leading-relaxed">
                             {item.description}
                           </p>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>
         </section>

        {/* Trend carousel + Impact phrases */}
        <section className="relative overflow-hidden bg-white py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-gray-100 via-gray-100/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto px-4 z-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#3e2626]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#3e2626]/80">
                  Radar MobiliAI
                </span>
                <h2 className="mt-4 text-4xl font-black text-[#3e2626]">
                  Tendências para aplicar agora nas suas campanhas.
                </h2>
                <p className="mt-3 text-[#4f3a2f]/75">
                  Nosso laboratório de IA cruza vendas, estoque e comportamento do cliente para sugerir
                  âncoras visuais que convertem.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-full border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10"
                  onClick={() => handleTrendNav('prev')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-full border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10"
                  onClick={() => handleTrendNav('next')}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="relative mt-10">
              <div className="grid gap-6 md:grid-cols-3">
                {trendCarrousel.length > 0 ? trendCarrousel.map((slide, idx) => (
                  <div
                    key={slide.title}
                    className={`rounded-3xl border border-[#3e2626]/15 bg-white p-6 transition-all duration-500 ${
                      idx === trendIndex ? 'shadow-xl scale-[1.02]' : 'opacity-60 scale-95'
                    }`}
                  >
                    <div className="relative h-44 overflow-hidden rounded-2xl bg-white">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-contain p-4"
                      />
                      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-[#3e2626]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white">
                        {slide.tag}
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-[#3e2626]">{slide.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-[#4f3a2f]/80">
                      {slide.bulletPoints.map((point: string) => (
                        <li key={point} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#C07A45]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-12 text-[#4f3a2f]/60">
                    Carregando tendências...
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-center gap-2">
                {trendCarrousel.length > 0 && trendCarrousel.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTrendIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === trendIndex ? 'w-8 bg-[#3e2626]' : 'w-3 bg-[#3e2626]/30'
                    }`}
                    aria-label={`Ir para tendência ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-14 grid gap-6 bg-[#3e2626] px-8 py-10 text-white md:grid-cols-3 md:rounded-3xl">
              {impactPhrases.map((impact) => (
                <div key={impact.title} className="space-y-3 border-white/15 py-2 md:border-l md:pl-6 first:md:border-l-0 first:md:pl-0">
                  <h3 className="text-2xl font-bold leading-snug">{impact.title}</h3>
                  <p className="text-sm text-white/80">{impact.subtitle}</p>
            </div>
              ))}
          </div>
        </div>
      </section>


        {/* Product showcase */}
        <section className="relative overflow-hidden bg-[#3e2626] py-32">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#3e2626] via-[#3e2626]/80 to-transparent pointer-events-none z-10" />
          

          <div className="container relative mx-auto px-4 z-20">
            {/* Header */}
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-14 pt-14 text-center mx-auto">
                <BlurText
                  text="Coleções reais, renders reais"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-5xl md:text-6xl font-black text-white"
                />
              </div>
              <p className="text-xl text-white/80 max-w-3xl mx-auto text-center leading-relaxed">
                As imagens abaixo vêm do nosso banco de produtos. Use-as para gerar moodboards, vitrines virtuais e
                campanhas personalizadas.
              </p>
            </motion.div>

            {/* Marquee com produtos - animação de entrada pela lateral */}
            <div className="mb-16 relative overflow-hidden">
              {/* Gradientes laterais para fade - mais intensos */}
              <div className="absolute left-0 top-0 bottom-0 w-40 bg-linear-to-r from-[#3e2626] via-[#3e2626]/80 to-transparent z-30 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-40 bg-linear-to-l from-[#3e2626] via-[#3e2626]/80 to-transparent z-30 pointer-events-none" />
              
              <Marquee className="[--duration:40s]">
                <MarqueeContent pauseOnHover className="flex gap-6">
                  {productShowcase.length > 0 ? [...productShowcase, ...productShowcase, ...productShowcase].map((product, idx) => {
                    // Calcula se o item está na primeira passagem (para animar apenas uma vez)
                    const isFirstPass = idx < productShowcase.length * 2;
                    const itemIndex = idx % productShowcase.length;
                    
                    // Mapeamento de categorias para nomes legíveis
                    const categoryNames: Record<string, string> = {
                      'SOFA': 'Sofá',
                      'MESA_CENTRO': 'Mesa de centro',
                      'POLTRONA': 'Poltrona',
                      'LUMINARIA': 'Luminária',
                      'ESTANTE': 'Estante',
                      'CADEIRA': 'Cadeira',
                      'ARMARIO': 'Armário',
                      'CAMA': 'Cama',
                      'QUADRO': 'Quadro',
                    };
                    
                    const displayCategory = categoryNames[product.category] || product.category;
                    
                    return (
                      <MarqueeItem 
                        key={`${product.name}-${idx}`} 
                        className="w-[380px]"
                      >
                        <div className="relative h-[480px] rounded-2xl bg-white overflow-hidden shadow-lg border border-white/10 group cursor-pointer hover:shadow-xl transition-shadow">
                          {/* Imagem */}
                          <div className="relative h-[55%] bg-gray-50">
                            <Image
                              src={product.src}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="380px"
                            />
                            
                            {/* Badge */}
                            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#3e2626] px-3 py-1.5 text-xs font-medium text-white">
                              <Star className="h-3 w-3 text-[#C07A45]" />
                              {displayCategory}
                            </div>
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="p-5 bg-white">
                            <h3 className="text-lg font-medium text-[#3e2626] mb-2">
                              {product.name}
                            </h3>
                            <p className="text-sm text-[#4f3a2f]/70 leading-relaxed mb-4 line-clamp-2">
                              {product.description}
                            </p>
                            
                            {/* Link */}
                            <Link 
                              href="/products" 
                              className="inline-flex items-center gap-2 text-sm font-medium text-[#C07A45] hover:text-[#8B4513] transition-colors group/link"
                            >
                              <span>Explorar coleção</span>
                              <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </MarqueeItem>
                    );
                  }) : (
                    <div className="w-full text-center py-12 text-white/60">
                      Carregando produtos...
                    </div>
                  )}
                </MarqueeContent>
              </Marquee>
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

