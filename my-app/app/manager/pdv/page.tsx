'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';
import { showAlert } from '@/lib/alerts';
import { 
  User, 
  Search, 
  UserCheck, 
  X, 
  ArrowRight, 
  ShoppingCart,
  Mail,
  Phone,
  CreditCard,
  TrendingUp,
  Sparkles,
  Package,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import PDVComponent from '@/components/PDVComponent';

import { Loader } from '@/components/ui/ai/loader';
export default function ManagerPDVPage() {
  const [customerSearchCpf, setCustomerSearchCpf] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [showPDV, setShowPDV] = useState(false);

  // Função auxiliar para verificar pedidos de retirada
  const getPickupOrdersFromCustomer = (customer: any) => {
    if (!customer?.purchases) return [];
    return customer.purchases.filter((purchase: any) => {
      // Verificar se é pedido online com retirada na loja
      const isPickup = purchase.notes && (
        purchase.notes.toLowerCase().includes('retirada') || 
        purchase.notes.toLowerCase().includes('pickup') ||
        purchase.notes.toLowerCase().includes('retirar')
      );
      // Verificar se está pendente ou preparando
      const isPending = purchase.status === 'PENDING' || purchase.status === 'PREPARING';
      // Verificar se é pedido online (pode ter shippingAddress vazio para retirada)
      const isOnline = purchase.isOnlineOrder === true;
      // Se não tem endereço de entrega, provavelmente é retirada
      const noShipping = !purchase.shippingAddress || purchase.shippingAddress.trim() === '';
      
      return isOnline && isPending && (isPickup || noShipping);
    });
  };

  const handleSearchCustomer = async () => {
    if (!customerSearchCpf.trim()) {
      showAlert('error', 'Digite um CPF para buscar');
      return;
    }

    if (customerSearchCpf.length !== 11) {
      showAlert('error', 'CPF deve ter 11 dígitos');
      return;
    }

    try {
      setSearchingCustomer(true);
      const customer = await adminAPI.getCustomerByCpf(customerSearchCpf);
      setFoundCustomer(customer);
      
      // Verificar automaticamente se tem produtos para retirar
      const pickupOrders = getPickupOrdersFromCustomer(customer);
      const hasPickup = pickupOrders.length > 0;
      
      if (hasPickup) {
        // Se tem produtos para retirar, mostrar informações e aguardar confirmação
        showAlert('info', `Cliente encontrado: ${customer.name}. Há ${pickupOrders.length} pedido(s) para retirada.`);
      } else {
        // Se não tem produtos para retirar, apenas mostrar mensagem de sucesso
        showAlert('success', `Cliente encontrado: ${customer.name}.`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Cliente não encontrado';
      if (error.response?.status === 404 || error.message?.includes('404')) {
        showAlert('warning', 'Cliente não encontrado. Você pode continuar sem cliente cadastrado.');
        setFoundCustomer(null);
      } else {
        showAlert('error', errorMessage);
      }
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Verificar se tem pedidos pendentes de retirada
  const getPickupOrders = () => {
    if (!foundCustomer) return [];
    return getPickupOrdersFromCustomer(foundCustomer);
  };

  const pickupOrders = getPickupOrders();
  const hasPickupOrders = pickupOrders.length > 0;

  // Verificar se tem dados necessários para iniciar venda
  const canStartSale = () => {
    if (!foundCustomer) return false;
    
    // Se tem produtos para retirar, precisa ter nome, telefone e CPF
    if (hasPickupOrders) {
      return !!(foundCustomer.name && foundCustomer.phone && foundCustomer.cpf);
    }
    
    // Se não tem produtos para retirar, pode iniciar venda normalmente
    return true;
  };

  const handleStartPDV = () => {
    // Validar antes de iniciar
    if (hasPickupOrders) {
      if (!foundCustomer?.name) {
        showAlert('error', 'Cliente precisa ter nome cadastrado para retirada de produtos');
        return;
      }
      if (!foundCustomer?.phone) {
        showAlert('error', 'Cliente precisa ter telefone cadastrado para retirada de produtos');
        return;
      }
      if (!foundCustomer?.cpf) {
        showAlert('error', 'Cliente precisa ter CPF cadastrado para retirada de produtos');
        return;
      }
    }
    setShowPDV(true);
  };

  const handleClearCustomer = () => {
    setFoundCustomer(null);
    setCustomerSearchCpf('');
    setShowPDV(false);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Se já abriu o PDV, mostrar o componente
  if (showPDV) {
    return (
      <div className="h-full">
        <PDVComponent 
          initialCustomer={foundCustomer || undefined}
          pickupOrders={pickupOrders}
          onReset={() => {
            setShowPDV(false);
            setFoundCustomer(null);
            setCustomerSearchCpf('');
          }}
        />
      </div>
    );
  }

  // Tela inicial de busca de CPF - Design padronizado
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Ponto de Venda
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Ponto de Venda
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Identifique o cliente pelo CPF antes de iniciar a venda ou continue sem cadastro.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <ShoppingCart className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-4xl mx-auto">

        {/* Card principal */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="bg-[#3e2626] text-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold mb-1">Buscar Cliente</CardTitle>
                <p className="text-white/90 text-sm">Digite o CPF para identificar o cliente no sistema</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Campo de busca */}
            <div className="space-y-6">
              <div className="relative">
                <div className="flex gap-3">
                  <div className="flex-1 relative group">
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={customerSearchCpf}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const numbersOnly = inputValue.replace(/\D/g, '');
                        if (numbersOnly.length <= 11) {
                          setCustomerSearchCpf(numbersOnly);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customerSearchCpf.trim() && customerSearchCpf.length === 11) {
                          e.preventDefault();
                          handleSearchCustomer();
                        }
                      }}
                      className="pl-14 pr-20 h-14 text-lg font-semibold border-border focus:border-[#3e2626] focus:ring-2 focus:ring-[#3e2626]/20 transition-all"
                    />
                    <div className="absolute left-5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    {customerSearchCpf.length > 0 && (
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Badge variant="secondary" className="text-xs">
                          {customerSearchCpf.length}/11
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSearchCustomer}
                    disabled={searchingCustomer || customerSearchCpf.length !== 11}
                    className="h-14 px-8 bg-[#3e2626] hover:bg-[#5a3a3a] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    {searchingCustomer ? (
                      <>
                        <Loader size={24} className="mr-2" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-6 w-6 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
                {customerSearchCpf.length > 0 && customerSearchCpf.length < 11 && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                    <X className="h-4 w-4" />
                    CPF deve ter 11 dígitos ({customerSearchCpf.length} digitado{customerSearchCpf.length !== 1 ? 's' : ''})
                  </p>
                )}
                {customerSearchCpf.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    CPF formatado: {customerSearchCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </p>
                )}
              </div>

              {/* Resultado da busca - Cliente encontrado */}
              {foundCustomer && (
                <div className="mt-6">
                  <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Avatar do cliente */}
                        <div className="relative">
                          <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-4 ring-[#3e2626]/20">
                            {foundCustomer.avatarUrl ? (
                              <AvatarImage 
                                src={foundCustomer.avatarUrl} 
                                alt={foundCustomer.name}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-[#3e2626] text-white text-2xl font-bold">
                              {foundCustomer.name?.charAt(0).toUpperCase() || <UserCheck className="h-12 w-12" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#3e2626] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                            <UserCheck className="h-4 w-4 text-white" />
                          </div>
                        </div>

                        {/* Informações do cliente */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-foreground">{foundCustomer.name}</h3>
                              <Badge className="bg-[#3e2626] text-white font-semibold">
                                Cliente Cadastrado
                              </Badge>
                            </div>
                            {foundCustomer._count && foundCustomer._count.purchases > 0 && (
                              <div className="flex items-center gap-2 text-primary">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {foundCustomer._count.purchases} compra(s) realizada(s)
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Dados do cliente */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {foundCustomer.cpf && (
                              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-2 bg-muted rounded-lg">
                                  <CreditCard className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground font-medium">CPF</p>
                                  <p className="text-sm font-semibold text-foreground">{formatCPF(foundCustomer.cpf)}</p>
                                </div>
                              </div>
                            )}
                            {foundCustomer.email && (
                              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-2 bg-muted rounded-lg">
                                  <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground font-medium">Email</p>
                                  <p className="text-sm font-semibold text-foreground truncate">{foundCustomer.email}</p>
                                </div>
                              </div>
                            )}
                            {foundCustomer.phone && (
                              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-2 bg-muted rounded-lg">
                                  <Phone className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground font-medium">Telefone</p>
                                  <p className="text-sm font-semibold text-foreground">{foundCustomer.phone}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Pedidos para Retirada */}
                          {hasPickupOrders ? (
                            <div className="mt-4 pt-4 border-t border-yellow-200 bg-yellow-50 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-yellow-500 rounded-lg">
                                  <Package className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                                    Produtos para Retirar
                                    <Badge className="bg-yellow-600 text-white">{pickupOrders.length}</Badge>
                                  </h4>
                                  <div className="space-y-2">
                                    {pickupOrders.slice(0, 3).map((order: any) => (
                                      <div key={order.id} className="text-sm text-yellow-800 bg-white rounded p-2">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">Pedido #{order.saleNumber}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {order.status === 'PENDING' ? 'Pendente' : 'Preparando'}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-yellow-700 mt-1">
                                          Valor: R$ {Number(order.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    ))}
                                    {pickupOrders.length > 3 && (
                                      <p className="text-xs text-yellow-700 mt-2">
                                        + {pickupOrders.length - 3} outro(s) pedido(s) para retirar
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Aviso de validação */}
                              {!canStartSale() && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-red-900 mb-1">
                                        Dados incompletos para retirada
                                      </p>
                                      <ul className="text-xs text-red-800 space-y-1">
                                        {!foundCustomer.name && <li>• Nome não cadastrado</li>}
                                        {!foundCustomer.phone && <li>• Telefone não cadastrado</li>}
                                        {!foundCustomer.cpf && <li>• CPF não cadastrado</li>}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="p-2 bg-muted rounded-lg">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Nenhum produto pendente para retirada
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Botões de ação */}
                          <div className="flex gap-3 pt-4">
                            {canStartSale() ? (
                              <Button
                                onClick={handleStartPDV}
                                className="flex-1 bg-[#3e2626] hover:bg-[#5a3a3a] h-12 text-base font-semibold text-white"
                              >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {hasPickupOrders ? 'Iniciar Venda (Retirada)' : 'Iniciar Venda'}
                                <ArrowUpRight className="ml-2 h-5 w-5" />
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="flex-1 bg-muted cursor-not-allowed h-12 text-base font-semibold text-muted-foreground"
                              >
                                <AlertCircle className="mr-2 h-5 w-5" />
                                Complete os dados para iniciar
                              </Button>
                            )}
                            <Button
                              onClick={handleClearCustomer}
                              variant="outline"
                              className="h-12 px-6 border-border hover:bg-muted"
                            >
                              <X className="mr-2 h-5 w-5" />
                              Trocar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Opção de continuar sem cliente - apenas se não tiver produtos para retirar */}
              {!foundCustomer && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="text-center space-y-4">
                    <p className="text-foreground text-base">
                      Cliente não encontrado ou deseja vender sem cadastro?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Para retirar produtos na loja, é necessário buscar o cliente pelo CPF.
                    </p>
                    <Button
                      onClick={handleStartPDV}
                      variant="outline"
                      className="w-full max-w-md h-12 text-base font-semibold border-border hover:bg-muted"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Continuar sem cliente cadastrado
                      <ArrowUpRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dica rápida */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" />
            Dica: Digite o CPF apenas com números ou use o formato com pontos e traço
          </p>
        </div>
      </div>
    </div>
  );
}
