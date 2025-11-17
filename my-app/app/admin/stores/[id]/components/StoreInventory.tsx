'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { adminAPI as adminApiAuth } from '@/lib/api-admin';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface StoreInventoryProps {
  storeId: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  minStock: number;
  maxStock: number | null;
  location: string | null;
  notes: string | null;
  stockInfo?: {
    totalStock: number;
    totalDistributed: number;
    distributedInOtherStores: number;
    availableForThisStore: number;
  };
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    price: number;
    costPrice: number | null;
    sku: string | null;
    barcode: string | null;
    imageUrl: string | null;
    imageUrls: string[];
    brand: string | null;
    colorName: string | null;
    colorHex: string | null;
    isActive: boolean;
    isAvailable: boolean;
    stock?: number;
  };
}

export default function StoreInventory({ storeId }: StoreInventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    minStock: 0,
    maxStock: '',
    location: '',
    notes: ''
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [addFormData, setAddFormData] = useState({
    initialQuantity: 0,
    minStock: 0
  });
  const [catalogCount, setCatalogCount] = useState<number>(0);
  const [itemToRemove, setItemToRemove] = useState<InventoryItem | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isAddCatalogOpen, setIsAddCatalogOpen] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState('');
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [selectedGlobal, setSelectedGlobal] = useState<any | null>(null);

  // Carregar catálogo global ao abrir o modal e ao alterar a busca
  const loadGlobalProducts = async () => {
    try {
      const data = await adminAPI.getGlobalProductsForCatalog(storeId, searchGlobal || undefined, 1, 50);
      setGlobalProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error('Erro ao carregar catálogo global:', e);
      setGlobalProducts([]);
    }
  };

  useEffect(() => {
    if (isAddCatalogOpen) {
      const t = setTimeout(() => loadGlobalProducts(), 400);
      return () => clearTimeout(t);
    }
  }, [isAddCatalogOpen, searchGlobal]);

  useEffect(() => {
    loadInventory();
    loadStoreProductsCount();
  }, [storeId]);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getStoreInventory(storeId);
      setInventory(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoreProductsCount = async () => {
    try {
      // 1) Buscar lista de lojas e usar o mesmo contador exibido no card (fonte da verdade do catálogo)
      const storesList = await adminAPI.getStores();
      const fromList = Array.isArray(storesList)
        ? storesList.find((s: any) => s.id === storeId)
        : (storesList?.stores || []).find((s: any) => s.id === storeId);
      if (fromList && typeof fromList?._count?.products === 'number') {
        setTotalProducts(fromList._count.products);
        return;
      }

      // 2) Fallback: Buscar a loja diretamente e contar products/_count.products.
      const store = await adminAPI.getStoreById(storeId);
      const fallbackCount =
        (typeof store?._count?.products === 'number' && store._count.products) ||
        (Array.isArray(store?.products) ? store.products.length : 0);

      setTotalProducts(fallbackCount);
    } catch (error) {
      console.error('Erro ao carregar total de produtos da loja:', error);
      setTotalProducts(0);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      quantity: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock?.toString() || '',
      location: item.location || '',
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      await adminAPI.updateStoreInventory(storeId, editingItem.product.id, {
        quantity: formData.quantity,
        minStock: formData.minStock,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      await loadInventory();
    } catch (error: any) {
      console.error('Erro ao atualizar estoque:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar estoque';
      alert(errorMessage);
    }
  };

  const handleOpenAddDialog = async () => {
    setIsAddDialogOpen(true);
    await loadAvailableProducts();
  };

  const loadAvailableProducts = async () => {
    try {
      const data = await adminAPI.getAvailableProductsForStore(storeId, searchAvailable || undefined);
      setAvailableProducts(data);
      // Informar quantos estão disponíveis e quantos existem no catálogo
      const store = await adminAPI.getStoreById(storeId);
      const count = (typeof store?._count?.products === 'number' && store._count.products) ||
        (Array.isArray(store?.products) ? store.products.length : 0);
      setCatalogCount(count);
    } catch (error) {
      console.error('Erro ao carregar produtos disponíveis:', error);
    }
  };

  useEffect(() => {
    if (isAddDialogOpen) {
      const timeout = setTimeout(() => {
        loadAvailableProducts();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [searchAvailable, isAddDialogOpen]);



  const handleAddProduct = async () => {
    if (!selectedProduct) return;

    try {
      await adminAPI.addProductToStore(
        storeId,
        selectedProduct.id,
        addFormData.initialQuantity,
        addFormData.minStock
      );
      setIsAddDialogOpen(false);
      setSelectedProduct(null);
      setAddFormData({ initialQuantity: 0, minStock: 0 });
      setSearchAvailable('');
      await loadInventory();
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao adicionar produto ao estoque';
      alert(errorMessage);
    }
  };

  const handleRemoveProduct = async () => {
    if (!itemToRemove) return;

    try {
      await adminAPI.removeProductFromStore(storeId, itemToRemove.product.id);
      setIsRemoveDialogOpen(false);
      setItemToRemove(null);
      await loadInventory();
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      alert('Erro ao remover produto do estoque');
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800' };
    if (quantity <= minStock) return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Em Estoque', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Estoque da Loja</h3>
          <p className="text-sm text-gray-600">
            O total de produtos abaixo refere-se ao catálogo vinculado a esta loja. 
            Para vender, distribua produtos ao estoque da loja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleOpenAddDialog}
            className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar ao Estoque
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setIsAddCatalogOpen(true);
              await loadGlobalProducts();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar ao Catálogo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Produtos (Catálogo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Produtos no Estoque (SKUs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unidades em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter(item => item.quantity > 0 && item.quantity > item.minStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventory.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventory.filter(item => item.quantity === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos no Estoque</CardTitle>
          <CardDescription>Lista completa de produtos com seus estoques nesta loja</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto no estoque'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente buscar por outro termo' : 'Adicione produtos ao estoque desta loja'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU / Código</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item.quantity, item.minStock);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const imageUrl = (item.product.imageUrls && item.product.imageUrls.length > 0) 
                                ? item.product.imageUrls[0] 
                                : item.product.imageUrl;
                              return imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product.name}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null;
                            })()}
                            <div className="hidden w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{item.product.name}</div>
                              {item.product.brand && (
                                <div className="text-xs text-gray-500">{item.product.brand}</div>
                              )}
                              {item.product.colorName && (
                                <div className="text-xs text-gray-500">
                                  Cor: {item.product.colorName}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.product.sku && (
                              <div className="text-gray-900">SKU: {item.product.sku}</div>
                            )}
                            {item.product.barcode && (
                              <div className="text-gray-500">Cód: {item.product.barcode}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-gray-900">{item.quantity}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm text-gray-600">{item.minStock}</div>
                        </TableCell>
                        <TableCell>
                          {item.location ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToRemove(item);
                                setIsRemoveDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Estoque</DialogTitle>
            <DialogDescription>
              Atualize as informações de estoque do produto: {editingItem?.product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Informações de Estoque */}
            {editingItem?.stockInfo && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Estoque Total do Produto:</span>
                  <span className="font-semibold text-gray-900">{editingItem.stockInfo.totalStock} unidades</span>
                </div>
                {editingItem.stockInfo.distributedInOtherStores > 0 && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Distribuído em Outras Lojas:</span>
                    <span className="font-semibold text-gray-700">{editingItem.stockInfo.distributedInOtherStores} unidades</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Disponível para Esta Loja:</span>
                  <span className={`font-semibold ${
                    editingItem.stockInfo.availableForThisStore > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {editingItem.stockInfo.availableForThisStore} unidades
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade Atual</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  max={editingItem?.stockInfo?.availableForThisStore || undefined}
                  value={formData.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const maxAvailable = editingItem?.stockInfo?.availableForThisStore;
                    if (maxAvailable !== undefined && value > maxAvailable) {
                      setFormData({ ...formData, quantity: maxAvailable });
                    } else {
                      setFormData({ ...formData, quantity: value });
                    }
                  }}
                />
                {editingItem?.stockInfo && (
                  <p className="text-xs text-gray-500">
                    Máximo disponível: {editingItem.stockInfo.availableForThisStore} unidades
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Estoque Máximo (opcional)</Label>
              <Input
                id="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                placeholder="Sem limite"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização na Loja</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Prateleira A-3, Corredor 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais sobre o estoque..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Estoque</DialogTitle>
            <DialogDescription>
              Selecione um SKU do catálogo desta loja para distribuir ao estoque.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs text-gray-600">
              Catálogo desta loja: {catalogCount} itens • Disponíveis para adicionar: {availableProducts.length}
            </div>
            <div className="space-y-2">
              <Label>Buscar Produto</Label>
              <Input
                placeholder="Digite o nome, SKU ou código de barras..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
              />
            </div>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {availableProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchAvailable ? 'Nenhum produto encontrado' : 'Digite para buscar produtos'}
                </div>
              ) : (
                <div className="divide-y">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedProduct?.id === product.id ? 'bg-[#3e2626]/10 border-l-4 border-[#3e2626]' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-center gap-3">
                        {(() => {
                          const imageUrl = (product.imageUrls && product.imageUrls.length > 0) 
                            ? product.imageUrls[0] 
                            : product.imageUrl;
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', imageUrl);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null;
                        })()}
                        <div className="hidden w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.sku && `SKU: ${product.sku} • `}
                            {product.brand && `${product.brand} • `}
                            R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {product.availableStock !== undefined && (
                            <div className="text-xs mt-1">
                              <span className={`font-medium ${
                                product.availableStock > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Estoque disponível: {product.availableStock} unidades
                              </span>
                              {product.distributedStock !== undefined && product.distributedStock > 0 && (
                                <span className="text-gray-500 ml-2">
                                  (Total: {product.stock || 0} • Distribuído: {product.distributedStock})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedProduct && (
              <div className="space-y-4 pt-4 border-t">
                {/* Informações de Estoque */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estoque Total do Produto:</span>
                    <span className="font-semibold text-gray-900">{selectedProduct.stock || 0} unidades</span>
                  </div>
                  {selectedProduct.distributedStock !== undefined && selectedProduct.distributedStock > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Já Distribuído:</span>
                      <span className="font-semibold text-gray-700">{selectedProduct.distributedStock} unidades</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Disponível para Adicionar:</span>
                    <span className={`font-semibold ${
                      (selectedProduct.availableStock || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedProduct.availableStock || 0} unidades
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addQuantity">Quantidade Inicial</Label>
                    <Input
                      id="addQuantity"
                      type="number"
                      min="0"
                      max={selectedProduct.availableStock || 0}
                      value={addFormData.initialQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const maxAvailable = selectedProduct.availableStock || 0;
                        setAddFormData({ ...addFormData, initialQuantity: Math.min(value, maxAvailable) });
                      }}
                    />
                    {selectedProduct.availableStock !== undefined && (
                      <p className="text-xs text-gray-500">
                        Máximo: {selectedProduct.availableStock} unidades
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addMinStock">Estoque Mínimo</Label>
                    <Input
                      id="addMinStock"
                      type="number"
                      min="0"
                      value={addFormData.minStock}
                      onChange={(e) => setAddFormData({ ...addFormData, minStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setSelectedProduct(null);
              setAddFormData({ initialQuantity: 0, minStock: 0 });
              setSearchAvailable('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={!selectedProduct}
              className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white"
            >
              Adicionar ao Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Catalog Dialog */}
      <Dialog open={isAddCatalogOpen} onOpenChange={setIsAddCatalogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Catálogo</DialogTitle>
            <DialogDescription>
              Selecione um produto do catálogo global para vincular a esta loja.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Produto (global)</Label>
              <Input
                placeholder="Digite o nome, SKU ou código de barras..."
                value={searchGlobal}
                onChange={(e) => setSearchGlobal(e.target.value)}
              />
            </div>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {globalProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchGlobal ? 'Nenhum produto encontrado' : 'Digite para buscar produtos'}
                </div>
              ) : (
                <div className="divide-y">
                  {globalProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedGlobal?.id === product.id ? 'bg-[#3e2626]/10 border-l-4 border-[#3e2626]' : ''
                      }`}
                      onClick={() => setSelectedGlobal(product)}
                    >
                      <div className="flex items-center gap-3">
                        {(() => {
                          const imageUrl = (product.imageUrls && product.imageUrls.length > 0) 
                            ? product.imageUrls[0] 
                            : product.imageUrl;
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null;
                        })()}
                        <div className="hidden w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.sku && `SKU: ${product.sku} • `}
                            {product.brand && `${product.brand} • `}
                            R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddCatalogOpen(false);
              setSelectedGlobal(null);
              setSearchGlobal('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedGlobal) return;
                try {
                  // Adiciona o produto ao catálogo da loja (atualiza storeId)
                  await adminAPI.addProductToStoreCatalog(storeId, selectedGlobal.id);
                  setIsAddCatalogOpen(false);
                  setSelectedGlobal(null);
                  setSearchGlobal('');
                  await loadStoreProductsCount();
                  await loadGlobalProducts(); // Recarregar lista para remover o produto adicionado
                  alert('Produto adicionado ao catálogo com sucesso!');
                } catch (e: any) {
                  alert(e?.response?.data?.message || e?.message || 'Erro ao adicionar produto ao catálogo');
                }
              }}
              disabled={!selectedGlobal}
              className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white"
            >
              Adicionar ao Catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Product Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Produto do Estoque</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{itemToRemove?.product.name}</strong> do estoque desta loja?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRemoveDialogOpen(false);
              setItemToRemove(null);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleRemoveProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

