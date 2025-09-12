'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Camera, MessageCircle, ShoppingCart, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transforme sua casa com{' '}
            <span className="text-blue-600">Inteligência Artificial</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Visualize como ficará sua parede antes de pintar. Nossa IA analisa suas fotos 
            e sugere as melhores cores e produtos para seu projeto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/color-visualizer">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Camera className="mr-2 h-5 w-5" />
                Visualizar Cores
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ver Produtos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Funcionalidades Inovadoras
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Visualização de Cores</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Envie uma foto da sua parede e veja como ficará com diferentes cores de tinta.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Palette className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Paletas Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Nossa IA sugere combinações harmoniosas de cores para criar ambientes perfeitos.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Assistente Virtual</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chatbot especializado em tintas para te ajudar com dicas e recomendações.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Produtos em Destaque
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando produtos...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
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
              <Button variant="outline">Ver Todos os Produtos</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para transformar sua casa?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece agora mesmo enviando uma foto e descubra as cores perfeitas para seu ambiente.
          </p>
          <Link href="/color-visualizer">
            <Button size="lg" variant="secondary">
              <Camera className="mr-2 h-5 w-5" />
              Começar Agora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}