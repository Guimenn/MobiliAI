'use client';

import { useState, useEffect, useMemo } from 'react';
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
  MapPin, 
  Phone, 
  Mail,
  Users,
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';

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
      
      let storesArray = [];
      if (Array.isArray(data)) {
        storesArray = data;
      } else if (data && Array.isArray(data.stores)) {
        storesArray = data.stores;
      } else if (data && Array.isArray(data.data)) {
        storesArray = data.data;
      } else {
        storesArray = [];
      }
      
      const storesWithEmployees = await Promise.all(
        storesArray.map(async (store: any) => {
          try {
            const employeesData = await adminAPI.getStoreEmployees(store.id);
            
            let employeesArray = [];
            if (Array.isArray(employeesData)) {
              employeesArray = employeesData;
            } else if (employeesData && Array.isArray(employeesData.employees)) {
              employeesArray = employeesData.employees;
            } else if (employeesData && Array.isArray(employeesData.data)) {
              employeesArray = employeesData.data;
            } else if (employeesData && Array.isArray(employeesData.users)) {
              employeesArray = employeesData.users;
            }
            
            return {
              ...store,
              _count: {
                ...store._count,
                users: employeesArray.length
              }
            };
          } catch (error) {
            return {
              ...store,
              _count: {
                ...store._count,
                users: 0
              }
            };
          }
        })
      );
      
      setStores(storesWithEmployees);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      toast.error('Erro ao carregar lojas');
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && store.isActive) ||
                         (filterStatus === 'inactive' && !store.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [stores, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: stores.length,
      active: stores.filter(s => s.isActive).length,
      employees: stores.reduce((sum, store) => sum + (store._count?.users || 0), 0),
      products: stores.reduce((sum, store) => sum + (store._count?.products || 0), 0),
    };
  }, [stores]);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 overflow-x-hidden max-w-full">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-4 sm:px-6 lg:px-8 py-10 text-primary-foreground shadow-sm w-full">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between w-full">
          <div className="max-w-xl space-y-4 w-full min-w-0">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Gestão de Lojas
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Gerenciar Lojas
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Gerencie todas as lojas da empresa, controle funcionários, estoque e operações de cada unidade.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => router.push('/admin/stores/new')}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Loja
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={loadStores}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid w-full max-w-full sm:max-w-md grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-xl min-w-0 flex-shrink-0">
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Store className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.total}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total de lojas</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.active}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Lojas ativas</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.employees}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Funcionários</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.products}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Produtos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <Card className="border border-border shadow-sm w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end w-full">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar lojas por nome ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todas as lojas</option>
                <option value="active">Apenas ativas</option>
                <option value="inactive">Apenas inativas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma loja encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros para encontrar lojas.'
                : 'Comece criando sua primeira loja.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button onClick={() => router.push('/admin/stores/new')} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Loja
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
          {filteredStores.map((store) => (
            <Card key={store.id} className="border border-border shadow-sm transition hover:shadow-md w-full min-w-0 max-w-full overflow-hidden">
              <CardContent className="p-6 w-full min-w-0">
                <div className="space-y-4 w-full min-w-0">
                  <div className="flex items-start justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate">{store.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {store.city}{store.state && `, ${store.state}`}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        `flex-shrink-0 ${
                          store.isActive 
                            ? 'border-border bg-muted/50 text-foreground' 
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`
                      }
                    >
                      {store.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  <div className="space-y-2 w-full min-w-0">
                    {store.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground w-full min-w-0">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate min-w-0">{store.address}</span>
                      </div>
                    )}
                    
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground w-full min-w-0">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate min-w-0">{store.phone}</span>
                      </div>
                    )}
                    
                    {store.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground w-full min-w-0">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate min-w-0">{store.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{store._count?.users || 0}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Funcionários</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{store._count?.products || 0}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Produtos</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/admin/stores/${store.id}`)}
                  >
                    Gerenciar Loja
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
