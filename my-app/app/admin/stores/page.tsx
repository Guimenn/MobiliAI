'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { adminAPI } from '@/lib/api-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Phone,
  Mail,
  Users,
  Package,
  TrendingUp
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
    sales: number;
  };
}

export default function AdminStores() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchStores();
  }, [isAuthenticated, user, router]);

  const fetchStores = async () => {
    try {
      const response = await adminAPI.getStores(token);

      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Lojas</h1>
              <p className="text-sm text-gray-600">Gerencie todas as lojas da empresa</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/admin/stores/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Loja
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar lojas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                  </div>
                  <Badge variant={store.isActive ? "default" : "secondary"}>
                    {store.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <CardDescription>
                  {store.city}, {store.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{store.email}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <Package className="h-4 w-4" />
                        <span>Produtos</span>
                      </div>
                      <div className="text-lg font-semibold">{store._count.products}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Vendas</span>
                      </div>
                      <div className="text-lg font-semibold">{store._count.sales}</div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma loja encontrada' : 'Nenhuma loja cadastrada'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando sua primeira loja'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/admin/stores/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Loja
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
