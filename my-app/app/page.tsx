'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Palette, 
  Camera, 
  MessageCircle, 
  ShoppingCart, 
  Star, 
  Sparkles,
  ArrowRight,
  Users,
  Zap,
  Shield,
  Truck,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { products, setProducts, isLoading, setLoading } = useAppStore();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [setProducts, setLoading]);

  const featuredProducts = products.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">MobiliAI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Funcionalidades
            </Link>
            <Link href="/products" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Produtos
            </Link>
            <Link href="/ai-processor" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              IA Decoradora
            </Link>
            <Link href="/furniture-visualizer" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Visualizador
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Decore sua casa com
            <span className="text-blue-600 block">Inteligência Artificial</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Teste móveis no seu ambiente real antes de comprar. Nossa IA Decoradora 
            transforma qualquer foto em um showroom virtual personalizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/furniture-visualizer">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                <Camera className="mr-2 h-5 w-5" />
                Testar IA Decoradora
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Ver Produtos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Por que escolher o MobiliAI?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Combinamos tecnologia de ponta com uma experiência de compra única
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>IA Decoradora</CardTitle>
                <CardDescription>
                  Visualize móveis no seu ambiente real usando inteligência artificial avançada
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Visualização Realista</CardTitle>
                <CardDescription>
                  Veja como os móveis ficam na sua casa antes de comprar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Assistente Virtual</CardTitle>
                <CardDescription>
                  Chatbot inteligente para te ajudar na escolha dos móveis perfeitos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Frete Grátis</CardTitle>
                <CardDescription>
                  Entrega gratuita para compras acima de R$ 500
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Garantia Total</CardTitle>
                <CardDescription>
                  Garantia estendida para produtos recomendados pela IA
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Comunidade Ativa</CardTitle>
                <CardDescription>
                  Participe da nossa comunidade de entusiastas de decoração
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">70%</div>
              <div className="text-blue-100">Usuários usam a IA</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30%</div>
              <div className="text-blue-100">Aumento em conversões</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1.000+</div>
              <div className="text-blue-100">Produtos disponíveis</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime garantido</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Descubra nossa seleção especial de móveis
            </p>
          </div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Carregando produtos...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow border-0">
                  <CardHeader className="p-4">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Palette className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-sm">{product.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {product.brand} • {product.color}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">
                        R$ {Number(product.price).toFixed(2)}
                      </span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">4.8</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/products">
              <Button variant="outline" size="lg">
                Ver Todos os Produtos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para transformar sua casa?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já descobriram o futuro da decoração
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              <Zap className="mr-2 h-5 w-5" />
              Começar Agora - É Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">MobiliAI</span>
              </div>
              <p className="text-gray-400">
                Revolucionando a experiência de compra de móveis com Inteligência Artificial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produtos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-white transition-colors">Catálogo</Link></li>
                <li><Link href="/ai-processor" className="hover:text-white transition-colors">IA Decoradora</Link></li>
                <li><Link href="/furniture-visualizer" className="hover:text-white transition-colors">Visualizador</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contato</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Sobre</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Carreiras</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Imprensa</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MobiliAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}