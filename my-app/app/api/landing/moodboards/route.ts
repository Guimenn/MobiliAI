import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Dados mockados como fallback
const mockMoodboards = [
  {
    image: '/IAsection/ImagemIA1.png',
    label: 'COLEÇÃO',
    headline: 'Ambiente Moderno com Paleta Terracota',
    description: 'Moodboard criado com IA usando produtos reais do catálogo. A combinação perfeita entre sofás, mesas e luminárias.',
    quote: '"A combinação perfeita entre tecnologia e design."',
    author: 'Cliente PintAi',
  },
  {
    image: '/IAsection/ImagemIA2.png',
    label: 'TREND',
    headline: 'Sala Contemporânea em Tons Neutros',
    description: 'Visualização realista gerada com nano-banana AI. Produtos selecionados automaticamente pela inteligência artificial.',
    quote: '"Resultado além das expectativas!"',
    author: 'Designer de Interiores',
  },
  {
    image: '/IAsection/ImagemIA3.png',
    label: 'DESTAQUE',
    headline: 'Quarto Minimalista com Toque Elegante',
    description: 'Renderização em alta definição usando móveis da coleção oficial. A IA posicionou cada elemento respeitando perspectiva e iluminação.',
    quote: '"A precisão da IA impressiona."',
    author: 'Arquiteta',
  },
];

export async function GET() {
  try {
    // Tentar buscar do backend
    const response = await axios.get(`${API_BASE_URL}/customer/products/featured?limit=6`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    const products = response.data || [];

    if (products.length > 0) {
      // Transformar produtos em formato de moodboards
      const moodboards = products.slice(0, 3).map((product: any, index: number) => ({
        image: product.imageUrls?.[0] || product.imageUrl || '/placeholder-image.jpg',
        label: product.category || 'Coleção',
        headline: product.name || `Moodboard ${index + 1}`,
        description: product.description || product.shortDescription || 'Ambiente criado com IA usando produtos reais do catálogo.',
        quote: `"A combinação perfeita entre tecnologia e design."`,
        author: 'Cliente PintAi',
      }));

      return NextResponse.json(moodboards);
    }

    // Se não houver produtos, retornar dados mockados
    return NextResponse.json(mockMoodboards);
  } catch (error: any) {
    console.error('Erro ao buscar moodboards:', error.message);
    // Retornar dados mockados em caso de erro
    return NextResponse.json(mockMoodboards);
  }
}

