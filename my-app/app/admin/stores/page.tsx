'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Phone, 
  Mail,
  Users,
  Package,
  DollarSign,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getStores();
      setStores(data);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && store.isActive) ||
                         (filterStatus === 'inactive' && !store.isActive);
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Lojas</h1>
                <p className="text-sm text-gray-600">Gerencie todas as lojas da empresa</p>
              </div>
            </div>
            <Button className="bg-[#3e2626] hover:bg-[#8B4513]">
              <Plus className="h-4 w-4 mr-2" />
              Nova Loja
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar lojas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              Todas
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              Ativas
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('inactive')}
              size="sm"
            >
              Inativas
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Store className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
                  <p className="text-sm text-gray-500">Total de Lojas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Store className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stores.filter(s => s.isActive).length}
                  </p>
                  <p className="text-sm text-gray-500">Lojas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stores.reduce((sum, store) => sum + (store._count?.users || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500">Funcionários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stores.reduce((sum, store) => sum + (store._count?.products || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500">Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <CardDescription>{store.city}, {store.state}</CardDescription>
                    </div>
                  </div>
                  <Badge className={store.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {store.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {store.address}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {store.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {store.email}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{store._count?.users || 0}</p>
                      <p className="text-xs text-gray-500">Funcionários</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{store._count?.products || 0}</p>
                      <p className="text-xs text-gray-500">Produtos</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-4">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma loja encontrada</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou criar uma nova loja.</p>
          </div>
        )}
      </div>
    </div>
  );
}