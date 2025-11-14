import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Dados mockados como fallback
const mockProducts = [
  {
    name: 'Sofá Retrátil Premium',
    description: 'Conforto e elegância em um só móvel. Perfeito para salas modernas.',
    src: '/IAsection/ImagemIA1.png',
    category: 'SOFA',
  },
  {
    name: 'Mesa de Centro Moderna',
    description: 'Design minimalista que complementa qualquer ambiente.',
    src: '/IAsection/ImagemIA2.png',
    category: 'MESA_CENTRO',
  },
  {
    name: 'Poltrona Elegante',
    description: 'Conforto premium com acabamento impecável.',
    src: '/IAsection/ImagemIA3.png',
    category: 'POLTRONA',
  },
  {
    name: 'Luminária de Piso',
    description: 'Iluminação moderna que transforma o ambiente.',
    src: '/IAsection/ImagemIA1.png',
    category: 'LUMINARIA',
  },
  {
    name: 'Estante Modular',
    description: 'Organize seu espaço com estilo e praticidade.',
    src: '/IAsection/ImagemIA2.png',
    category: 'ESTANTE',
  },
  {
    name: 'Cadeira Ergonômica',
    description: 'Conforto para longas horas de trabalho.',
    src: '/IAsection/ImagemIA3.png',
    category: 'CADEIRA',
  },
];

export async function GET() {
  try {
    // Tentar buscar do backend
    const response = await axios.get(`${API_BASE_URL}/customer/products/featured?limit=12`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    const products = response.data || [];

    if (products.length > 0) {
      // Transformar produtos em formato de showcase
      const showcase = products.map((product: any) => ({
        name: product.name || 'Produto',
        description: product.description || product.shortDescription || 'Produto de alta qualidade',
        src: product.imageUrls?.[0] || product.imageUrl || '/placeholder-image.jpg',
        category: product.category || 'DESTAQUE',
      }));

      return NextResponse.json(showcase);
    }

    // Se não houver produtos, retornar dados mockados
    return NextResponse.json(mockProducts);
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error.message);
    // Retornar dados mockados em caso de erro
    return NextResponse.json(mockProducts);
  }
}

