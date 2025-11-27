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
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import BlurText from '@/components/ui/shadcn-io/blur-text';
import { Marquee, MarqueeContent, MarqueeItem } from '@/components/ui/shadcn-io/marquee';
import { CardContainer, CardBody, CardItem } from '@/components/ui/shadcn-io/3d-card';
import { FlipWords } from '@/components/ui/shadcn-io/flip-words';
import { TextRevealButton } from '@/components/ui/shadcn-io/text-reveal-button';

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
  
  // Estados para dados do banco
  const [transformationGallery, setTransformationGallery] = useState<TransformationItem[]>([]);
  const [referenceMoodboards, setReferenceMoodboards] = useState<MoodboardItem[]>([]);
  const [trendCarrousel, setTrendCarrousel] = useState<TrendItem[]>([]);
  const [productShowcase, setProductShowcase] = useState<ProductItem[]>([]);
  
  // Dados estáticos (podem ser movidos para o banco depois)
  const differentiators = [
    {
      icon: <Cpu className="h-8 w-8" />,
      title: 'IA de última geração',
      description: 'Tecnologia avançada de processamento de imagens e reconhecimento de padrões.',
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Resultados instantâneos',
      description: 'Transformações em segundos, sem espera ou processamento demorado.',
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: 'Integração completa',
      description: 'Conectado diretamente com seu catálogo de produtos e estoque.',
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
      title: 'Escolha a cor',
      description: 'Selecione a paleta de cores da sua marca ou personalize.',
    },
    {
      step: '3',
      title: 'IA processa',
      description: 'Nossa IA aplica as transformações automaticamente.',
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
    <div className="min-h-screen bg-[#f7f3ef] text-gray-900">
      <Header />
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center pt-40 pb-24">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image src="/hero-bg.png" alt="Ambiente decorado com IA" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-[#3e2626]/85 mix-blend-multiply" />
            <div className="absolute inset-0 bg-linear-to-br from-[#3e2626]/85 via-[#4f3223]/75 to-[#8B4513]/60" />
          </div>

          <div className="container relative z-10 mx-auto flex flex-col gap-20 px-4 lg:flex-row lg:items-center">
            <div className="max-w-4xl text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold tracking-wide backdrop-blur-sm mb-8"
              >
                <Sparkles className="h-4 w-4 text-[#F7C194]" />
                <span className="text-white">Powered by MobiliAI</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <BlurText
                  text="Visualize ambientes reais"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight text-white mb-4"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight text-white">
                    com a paleta
                  </span>
                  <FlipWords
                    words={['da sua marca.', 'personalizada.', 'exclusiva.', 'única.']}
                    duration={3000}
                    className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight text-[#F7C194]"
                  />
                </div>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mb-12"
              >
                Transforme fotos de clientes em minutos, substituindo cores de parede, mobiliário e iluminação com o
                motor nano-banana AI. O mesmo tom, a mesma textura, bem na tela.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <Link href="/IA-demo">
                  <TextRevealButton
                    text="Experimentar agora"
                    icon={<Rocket className="h-6 w-6" />}
                    className="h-16 rounded-full bg-white px-12 text-lg font-semibold text-[#3e2626] shadow-2xl hover:bg-white/95 hover:shadow-white/50 hover:text-brown-500"
                  />
                </Link>
                <Link href="/products">
                  <TextRevealButton
                    text="Ver catálogo real"
                    icon={<ImageIcon className="h-6 w-6" />}
                    className="h-16 rounded-full border-2 border-white/70 bg-white/10 px-12 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:border-white"
                  />
                </Link>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-6 text-sm text-white/70"
              >
                * Login necessário apenas para utilizar a experiência completa com IA.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative w-full max-w-xl lg:max-w-lg"
            >
              <div className="relative h-[450px] lg:h-[550px] rounded-3xl border-2 border-white/30 bg-white/10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden group">
                <Image
                  src="/IAsection/ImagemIA3.png"
                  alt="Visualização de quarto gerada pela IA"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 1024px) 100vw, 500px"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#3e2626]/20 to-transparent" />
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -bottom-10 -right-8 hidden w-56 rounded-3xl border border-white/30 bg-white/10 p-4 shadow-2xl backdrop-blur-lg md:block"
              >
                <div className="relative h-28 overflow-hidden rounded-2xl">
                  <Image src="/IAsection/ImagemIA1.png" alt="Renderização de sala pela IA" fill className="object-cover" sizes="190px" />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em] text-white/80">Resultado em 12s</p>
                <p className="text-sm text-white">IA posicionou paleta e mobiliário da coleção Oslo automaticamente.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Highlights */}
        <section className="relative overflow-hidden bg-white py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#3e2626]/10 via-[#3e2626]/5 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto grid items-center gap-12 px-4 md:grid-cols-[1.15fr,0.85fr] z-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#3e2626]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-[#3e2626]">
                <Palette className="h-4 w-4" />
                Paleta oficial PintAi
              </span>
              <h2 className="mt-6 text-4xl font-black leading-tight text-[#3e2626] sm:text-5xl">
                Harmonia entre tecnologia e o DNA visual da sua loja.
              </h2>
              <p className="mt-6 text-lg text-[#4f3a2f]/80">
                Utilizamos a mesma cartela cromática das suas coleções para sugerir combinações que vendem. A IA entende
                textura, iluminação e materiais, garantindo uma prévia fiel ao produto final.
              </p>
              <div className="mt-10 space-y-4">
                {[
                  {
                    icon: <Lightbulb className="h-5 w-5" />,
                    title: 'Sugestões inteligentes de paleta',
                    description: 'Combinações automáticas baseadas em estilos e histórico de vendas.',
                  },
                  {
                    icon: <CheckCircle2 className="h-5 w-5" />,
                    title: 'Sem retrabalho de edição',
                    description: 'A IA recorta e aplica móveis respeitando sombras e perspectiva.',
                  },
                  {
                    icon: <Star className="h-5 w-5" />,
                    title: 'Moodboards prontos para aprovação',
                    description: 'Renderizamos peças reais com acabamento fotográfico em segundos.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-[#3e2626]/15 bg-[#f7f1eb] px-5 py-4 shadow-sm"
                  >
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3e2626]/10 text-[#3e2626]">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#3e2626]">{item.title}</h3>
                      <p className="text-sm text-[#4f3a2f]/75">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-[#3e2626]/15 bg-[#3e2626]/5 shadow-[0_30px_70px_-45px_rgba(62,38,38,0.9)]">
              <Image
                src="/IAsection/ImagemIA2.png"
                alt="Transformação de sala com IA"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 420px"
              />
              <div className="absolute left-6 top-6 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/90 backdrop-blur">
                IA aplicada
              </div>
              <div className="absolute bottom-0 w-full bg-linear-to-t from-[#3e2626]/80 via-[#3e2626]/30 to-transparent p-6 text-sm text-white/90">
                Substituímos o sofá, adicionamos luminária e harmonizamos com tapete terracota.
            </div>
          </div>
        </div>
      </section>

        {/* Feature grid */}
        <section className="relative overflow-hidden bg-[#efe3d9] py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#efe3d9] via-[#efe3d9]/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto px-4 z-20">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-[0.35em] text-[#3e2626]/70 sm:text-4xl">
                Recursos exclusivos
            </h2>
              <p className="mt-4 text-lg text-[#4f3a2f]/75">
                Tudo o que você precisa para encantar o cliente antes mesmo da obra começar.
            </p>
          </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
                <div
                  key={feature.title}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                  className="group relative overflow-hidden rounded-3xl border border-[#3e2626]/10 bg-white/90 p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${feature.gradient} text-white shadow-lg transition duration-500 ${
                      hoveredFeature === index ? 'scale-105 rotate-2' : ''
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#3e2626]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4f3a2f]/75">{feature.description}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

        {/* Transformation gallery */}
        <section className="relative overflow-hidden bg-white py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#efe3d9] via-[#efe3d9]/80 to-transparent pointer-events-none z-10" />
          
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
              <div className="inline-flex items-center rounded-full border border-[#3e2626]/20 bg-[#3e2626]/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#3e2626]/80">
                <Sparkles className="mr-2 h-4 w-4" />
                nano-banana inside
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {transformationGallery.length > 0 ? transformationGallery.map((item) => (
                <div
                  key={item.title}
                  className="group relative h-72 overflow-hidden rounded-3xl border border-[#3e2626]/10 bg-[#f7f3ef] shadow-sm"
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
              )) : (
                <div className="col-span-full text-center py-12 text-[#4f3a2f]/60">
                  Carregando transformações...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Reference moodboards */}
        <section className="relative overflow-hidden bg-[#efe7e0] py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#efe7e0] via-[#efe7e0]/80 to-transparent pointer-events-none z-10" />
          
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
                    <div className="rounded-2xl bg-[#3e2626]/5 p-5 text-[#3e2626]">
                      <Quote className="mb-3 h-6 w-6 text-[#C07A45]" />
                      <p className="text-sm italic text-[#3e2626]/90">
                        {referenceMoodboards[referenceIndex].quote}
                      </p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#3e2626]/70">
                        {referenceMoodboards[referenceIndex].author}
                      </p>
                    </div>
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

        {/* Recursos e Fluxo com componentes Shadcn */}
        <section className="relative overflow-hidden bg-linear-to-b from-white via-[#fefbf8] to-[#f7f3ef] py-32">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#efe7e0] via-[#efe7e0]/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#f7f3ef] via-[#f7f3ef]/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto px-4 z-20">
            {/* Header */}
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6">
                <BlurText
                  text="Por que escolher PintAi"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-4xl md:text-5xl font-black text-[#3e2626]"
                />
              </div>
              <p className="text-lg text-[#4f3a2f]/70 max-w-2xl mx-auto">
                Tecnologia de IA avançada que transforma a forma como você trabalha com decoração e design.
              </p>
            </motion.div>

            {/* Grid de recursos com 3D Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {differentiators.map((item, idx) => (
                <CardContainer
                  key={item.title}
                  containerClassName="py-0"
                >
                  <CardBody className="w-full h-full">
                    <CardItem
                      translateZ="30"
                      className="w-full h-full"
                    >
                      <motion.div
                        className="relative w-full h-full min-h-[280px] rounded-3xl bg-white/95 backdrop-blur-sm p-8 shadow-xl border-2 border-[#3e2626]/10 hover:border-[#C07A45]/50 transition-all duration-500 group"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        whileHover={{ y: -8 }}
                      >
                        {/* Ícone com Sparkles */}
                        <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#3e2626] to-[#8B4513] text-white shadow-lg">
                          {item.icon}
                        </div>
                        
                        <h3 className="text-xl font-bold text-[#3e2626] mb-3">
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#4f3a2f]/70 leading-relaxed">
                          {item.description}
                        </p>
                        
                        {/* Barra decorativa */}
                        <motion.div
                          className="mt-4 h-1 w-0 bg-linear-to-r from-[#C07A45] to-[#F7C194] rounded-full group-hover:w-full transition-all duration-500"
                        />
                        
                        {/* Efeito de brilho */}
                        <motion.div
                          className="absolute inset-0 rounded-3xl bg-linear-to-br from-[#C07A45]/10 to-[#8B4513]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        />
                      </motion.div>
                    </CardItem>
                  </CardBody>
                </CardContainer>
              ))}
            </div>

            {/* Timeline */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h3 className="text-3xl font-black text-[#3e2626] mb-4">
                  Como funciona
                </h3>
                <p className="text-lg text-[#4f3a2f]/70">
                  Quatro passos simples para resultados incríveis
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {timeline.map((item, idx) => (
                  <motion.div
                    key={item.step}
                    className="relative rounded-3xl bg-white/95 backdrop-blur-sm p-6 shadow-lg border-2 border-[#3e2626]/10 hover:border-[#C07A45]/50 transition-all duration-500 group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    {/* Número do passo */}
                    <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#3e2626] to-[#8B4513] text-xl font-black text-white shadow-xl border-4 border-white">
                      {item.step}
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-lg font-bold text-[#3e2626] mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-[#4f3a2f]/70 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trend carousel + Impact phrases */}
        <section className="relative overflow-hidden bg-white py-20">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#f7f3ef] via-[#f7f3ef]/80 to-transparent pointer-events-none z-10" />
          
          {/* Gradiente inferior para transição */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          <div className="container relative mx-auto px-4 z-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#3e2626]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#3e2626]/80">
                  Radar PintAi
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
                    className={`rounded-3xl border border-[#3e2626]/15 bg-[#fdf7f1] p-6 transition-all duration-500 ${
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
              <div className="mb-6">
                <BlurText
                  text="Coleções reais, renders reais"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-5xl md:text-6xl font-black text-white"
                />
              </div>
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
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
                    
                    return (
                      <MarqueeItem 
                        key={`${product.name}-${idx}`} 
                        className="w-[400px]"
                      >
                        <motion.div
                          className="relative h-[500px] rounded-3xl bg-white overflow-hidden shadow-2xl group cursor-pointer"
                          initial={{ 
                            opacity: 0, 
                            x: -150, 
                            scale: 0.7,
                            filter: "blur(10px)"
                          }}
                          animate={isFirstPass ? { 
                            opacity: 1, 
                            x: 0, 
                            scale: 1,
                            filter: "blur(0px)",
                            transition: {
                              duration: 1.2,
                              ease: [0.16, 1, 0.3, 1],
                              delay: itemIndex * 0.15
                            }
                          } : {
                            opacity: 1,
                            x: 0,
                            scale: 1,
                            filter: "blur(0px)"
                          }}
                          whileHover={{ y: -10, scale: 1.02 }}
                        >
                          {/* Imagem */}
                          <div className="relative h-[60%] bg-linear-to-br from-[#f7f3ef] to-white">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={isFirstPass ? {
                                scale: 1,
                                opacity: 1,
                                transition: {
                                  delay: itemIndex * 0.15 + 0.3,
                                  duration: 0.8,
                                  ease: [0.16, 1, 0.3, 1]
                                }
                              } : {
                                scale: 1,
                                opacity: 1
                              }}
                            >
                              <Image
                                src={product.src}
                                alt={product.name}
                                fill
                                className="object-contain p-8"
                                sizes="400px"
                              />
                            </motion.div>
                            
                            {/* Badge */}
                            <motion.div 
                              className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#3e2626] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-white shadow-lg"
                              initial={{ scale: 0, rotate: -180, opacity: 0 }}
                              animate={isFirstPass ? {
                                scale: 1, 
                                rotate: 0,
                                opacity: 1,
                                transition: {
                                  delay: itemIndex * 0.15 + 0.5,
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 15
                                }
                              } : {
                                scale: 1,
                                rotate: 0,
                                opacity: 1
                              }}
                            >
                              <Star className="h-3.5 w-3.5 text-[#C07A45]" />
                              {product.category}
                            </motion.div>
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="p-6 bg-white">
                            <motion.h3 
                              className="text-2xl font-bold text-[#3e2626] mb-2"
                              initial={{ opacity: 0, y: 30 }}
                              animate={isFirstPass ? {
                                opacity: 1, 
                                y: 0,
                                transition: {
                                  delay: itemIndex * 0.15 + 0.6,
                                  duration: 0.6,
                                  ease: [0.16, 1, 0.3, 1]
                                }
                              } : {
                                opacity: 1,
                                y: 0
                              }}
                            >
                              {product.name}
                            </motion.h3>
                            <motion.p 
                              className="text-sm text-[#4f3a2f]/70 leading-relaxed mb-4"
                              initial={{ opacity: 0 }}
                              animate={isFirstPass ? {
                                opacity: 1,
                                transition: {
                                  delay: itemIndex * 0.15 + 0.7,
                                  duration: 0.5
                                }
                              } : {
                                opacity: 1
                              }}
                            >
                              {product.description}
                            </motion.p>
                            
                            {/* Botão */}
                            <motion.div
                              className="inline-flex items-center gap-2 text-[#C07A45] font-semibold"
                              whileHover={{ x: 5 }}
                              initial={{ opacity: 0, x: -20 }}
                              animate={isFirstPass ? {
                                opacity: 1,
                                x: 0,
                                transition: {
                                  delay: itemIndex * 0.15 + 0.8,
                                  duration: 0.5
                                }
                              } : {
                                opacity: 1,
                                x: 0
                              }}
                            >
                              <span className="text-sm">Explorar coleção</span>
                              <ArrowRight className="h-4 w-4" />
                            </motion.div>
                          </div>
                          
                          {/* Overlay no hover */}
                          <motion.div
                            className="absolute inset-0 bg-linear-to-t from-[#C07A45]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          />
                        </motion.div>
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

            {/* Grid de produtos principais */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productShowcase.length > 0 ? productShowcase.map((product, idx) => (
                <motion.div
                  key={product.name}
                  className="relative h-full rounded-3xl bg-white overflow-hidden shadow-xl border-2 border-white/20 group cursor-pointer"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ y: -8 }}
                >
                  {/* Imagem */}
                  <div className="relative h-64 bg-linear-to-br from-[#f7f3ef] to-white overflow-hidden">
                    <motion.div
                      className="relative w-full h-full"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Image
                        src={product.src}
                        alt={product.name}
                        fill
                        className="object-contain p-6"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </motion.div>
                    
                    {/* Badge */}
                    <motion.div 
                      className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#3e2626] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        type: "spring",
                        stiffness: 200,
                        delay: idx * 0.15 + 0.2
                      }}
                    >
                      <Star className="h-3 w-3 text-[#C07A45]" />
                      {product.category}
                    </motion.div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-bold text-[#3e2626] mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#4f3a2f]/70 leading-relaxed mb-4">
                      {product.description}
                    </p>
                    
                    {/* Barra decorativa */}
                    <motion.div
                      className="h-1 w-0 bg-linear-to-r from-[#C07A45] to-[#F7C194] rounded-full group-hover:w-full transition-all duration-500"
                    />
                  </div>
                  
                  {/* Efeito de brilho */}
                  <motion.div
                    className="absolute inset-0 bg-linear-to-br from-[#C07A45]/10 to-[#8B4513]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  />
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-12 text-white/60">
                  Carregando produtos...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-[#3e2626] py-20 text-white">
          {/* Gradiente superior para transição */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#3e2626] via-[#3e2626]/80 to-transparent pointer-events-none z-10" />
          
          {/* Background Beams */}
          
          <div className="absolute inset-0 opacity-10 z-0">
            <Image src="/hero-bg.png" alt="" fill className="object-cover" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Transforme o atendimento em uma experiência memorável.
          </h2>
            <p className="mt-4 text-white/80">
              Faça o upload de um ambiente agora e veja a IA aplicar a paleta da PintAi, sugerir produtos reais e gerar
              imagens que vendem.
          </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
                className="h-14 rounded-full bg-white px-10 text-base font-semibold text-[#3e2626] transition hover:bg-white/90"
              asChild
            >
              <Link href="/IA-demo">
                <Rocket className="mr-2 h-5 w-5" />
                  Entrar no simulador
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
                className="h-14 rounded-full border-white/60 px-10 text-base font-semibold text-white transition hover:bg-white/10"
              asChild
            >
              <Link href="/products">
                  Conferir catálogo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/60">
              a mesma experiência nas lojas físicas e online
            </p>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}

