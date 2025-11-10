'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Eye, Edit, Save, DollarSign, Package, Tag, Hash, Palette, Building, Ruler, Weight, Brush, Trash2, Zap, Percent, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import ImageCarousel from './ImageCarousel';
import { uploadMultipleProductImages, supabase } from '@/lib/supabase';

interface AdminProductModalProps {
  product: any | null;
  isOpen: boolean;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onProductUpdated: (product: any) => void;
  onProductDeleted: (productId: string) => void;
}

export default function AdminProductModal({ product, isOpen, mode, onClose, onProductUpdated, onProductDeleted }: AdminProductModalProps) {
  const { token, user } = useAppStore();
  
  // Verificar se o usuário pode gerenciar ofertas (apenas ADMIN ou STORE_MANAGER)
  const canManageSales = user?.role === 'ADMIN' || user?.role === 'admin' || 
                         user?.role === 'STORE_MANAGER' || user?.role === 'store_manager';
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
  const [editedProduct, setEditedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      // Criar um produto vazio para o modo de criação
      setEditedProduct({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: 'MESA_CENTRO',
        sku: '',
        isActive: true,
        rating: 0,
        reviews: 0,
        is3D: false,
        // Campos de oferta
        isOnSale: false,
        salePrice: undefined,
        saleStartDate: '',
        saleEndDate: '',
        isFlashSale: false,
        flashSalePrice: undefined,
        flashSaleStartDate: '',
        flashSaleEndDate: '',
        flashSaleDurationHours: undefined
      });
      setExistingImages([]);
      setUploadedImages([]);
    } else if (product) {
      // Converter datas para formato correto se vierem do backend
      const processedProduct = { ...product };
      
      // Converter datas de oferta normal se existirem
      if (processedProduct.saleStartDate) {
        processedProduct.saleStartDate = typeof processedProduct.saleStartDate === 'string' 
          ? processedProduct.saleStartDate 
          : new Date(processedProduct.saleStartDate).toISOString();
      }
      if (processedProduct.saleEndDate) {
        processedProduct.saleEndDate = typeof processedProduct.saleEndDate === 'string' 
          ? processedProduct.saleEndDate 
          : new Date(processedProduct.saleEndDate).toISOString();
      }
      
      // Converter datas de oferta relâmpago se existirem
      if (processedProduct.flashSaleStartDate) {
        processedProduct.flashSaleStartDate = typeof processedProduct.flashSaleStartDate === 'string' 
          ? processedProduct.flashSaleStartDate 
          : new Date(processedProduct.flashSaleStartDate).toISOString();
      }
      if (processedProduct.flashSaleEndDate) {
        processedProduct.flashSaleEndDate = typeof processedProduct.flashSaleEndDate === 'string' 
          ? processedProduct.flashSaleEndDate 
          : new Date(processedProduct.flashSaleEndDate).toISOString();
      }
      // Calcular duração em horas se tiver data início e fim
      if (processedProduct.flashSaleStartDate && processedProduct.flashSaleEndDate) {
        const start = new Date(processedProduct.flashSaleStartDate);
        const end = new Date(processedProduct.flashSaleEndDate);
        const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        processedProduct.flashSaleDurationHours = hours > 0 ? hours : undefined;
      }
      
      setEditedProduct(processedProduct);
      setExistingImages(product?.imageUrls || []);
      setUploadedImages([]);
    }
  }, [product, mode]);

  useEffect(() => {
    setIsEditing(mode === 'edit' || mode === 'create');
  }, [mode]);

  const categories = [
    { value: 'SOFA', label: 'Sofá' },
    { value: 'MESA', label: 'Mesa' },
    { value: 'CADEIRA', label: 'Cadeira' },
    { value: 'ARMARIO', label: 'Armário' },
    { value: 'ESTANTE', label: 'Estante' },
    { value: 'POLTRONA', label: 'Poltrona' },
    { value: 'QUADRO', label: 'Quadro' },
    { value: 'LUMINARIA', label: 'Luminária' },
    { value: 'MESA_CENTRO', label: 'Mesa de centro' },
  ];

  const handleSave = async () => {
    if (!editedProduct) return;

    try {
      setIsLoading(true);
      
      let result: any = null;
      console.log('🔍 Modo atual:', mode);
      console.log('🔍 isEditing:', isEditing);
      console.log('🔍 editedProduct:', editedProduct);
      console.log('🔍 editedProduct.id:', editedProduct?.id);
      
      // Determinar o modo real baseado em isEditing e editedProduct.id
      const actualMode = mode === 'create' ? 'create' : (isEditing && editedProduct?.id ? 'edit' : mode);
      console.log('🔍 Modo real determinado:', actualMode);
      
      if (actualMode === 'create') {
        console.log('✅ Entrando no modo de criação');
        // Obter storeId - usar o primeiro store disponível
        const stores = await adminAPI.getStores();
        const storeId = stores.length > 0 ? stores[0].id : null;
        
        if (!storeId) {
          throw new Error('Nenhuma loja encontrada. Crie uma loja primeiro.');
        }

        // Validar campos obrigatórios
        if (!editedProduct.name || !editedProduct.category || editedProduct.price === undefined || editedProduct.stock === undefined) {
          throw new Error('Nome, categoria, preço e estoque são obrigatórios');
        }

        // Validar categoria
        const validCategories = ['SOFA', 'MESA', 'CADEIRA', 'ARMARIO', 'ESTANTE', 'POLTRONA', 'QUADRO', 'LUMINARIA', 'MESA_CENTRO'];
        if (!validCategories.includes(editedProduct.category)) {
          throw new Error(`Categoria inválida: ${editedProduct.category}. Use uma das seguintes: ${validCategories.join(', ')}`);
        }

        // Validar preço
        if (editedProduct.price < 0) {
          throw new Error('Preço não pode ser negativo');
        }

        // Validar estoque
        if (editedProduct.stock < 0) {
          throw new Error('Estoque não pode ser negativo');
        }

        // Validar supplierId se fornecido (opcional)
        if (editedProduct.supplierId && editedProduct.supplierId.trim()) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(editedProduct.supplierId.trim())) {
            console.warn('⚠️ ID do fornecedor inválido, será ignorado:', editedProduct.supplierId);
            // Não lançar erro, apenas ignorar o supplierId inválido
            editedProduct.supplierId = '';
          }
        }

        // Incluir todos os campos do produto
        const productData: any = {
          name: editedProduct.name.trim(),
          description: editedProduct.description?.trim() || '',
          category: editedProduct.category,
          price: Number(editedProduct.price),
          stock: Number(editedProduct.stock),
          sku: editedProduct.sku?.trim() || '',
          isAvailable: editedProduct.isActive ?? true, // Usar isAvailable conforme DTO
          colorName: editedProduct.colorName?.trim() || '',
          brand: editedProduct.brand?.trim() || '',
          imageUrls: existingImages || [],
          storeId: storeId
        };

        // Adicionar campos de oferta apenas se o usuário tiver permissão
        if (canManageSales) {
          if (editedProduct.isOnSale) {
            productData.isOnSale = true;
            if (editedProduct.salePrice) productData.salePrice = Number(editedProduct.salePrice);
            if (editedProduct.saleStartDate) productData.saleStartDate = editedProduct.saleStartDate;
            if (editedProduct.saleEndDate) productData.saleEndDate = editedProduct.saleEndDate;
          } else {
            productData.isOnSale = false;
          }

          if (editedProduct.isFlashSale) {
            productData.isFlashSale = true;
            // Salvar percentual de desconto se houver
            if (editedProduct.flashSaleDiscountPercent) {
              productData.flashSaleDiscountPercent = Number(editedProduct.flashSaleDiscountPercent);
              // Calcular preço baseado no percentual
              if (editedProduct.price) {
                const discount = (editedProduct.price * editedProduct.flashSaleDiscountPercent) / 100;
                productData.flashSalePrice = editedProduct.price - discount;
              }
            } else if (editedProduct.flashSalePrice) {
              productData.flashSalePrice = Number(editedProduct.flashSalePrice);
            }
            // Sempre garantir que há data início e fim
            if (editedProduct.flashSaleStartDate) {
              // Converter para formato ISO completo se necessário
              // O input datetime-local retorna formato "YYYY-MM-DDTHH:mm" sem segundos e timezone
              const startDateStr = editedProduct.flashSaleStartDate;
              let startDate: Date;
              if (startDateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                // Formato datetime-local: criar Date usando componentes no timezone local
                const [datePart, timePart] = startDateStr.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes] = timePart.split(':').map(Number);
                // Usar construtor Date com componentes (sempre usa timezone local)
                startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
              } else {
                startDate = new Date(startDateStr);
              }
              // Garantir formato ISO completo (com segundos e timezone)
              if (isNaN(startDate.getTime())) {
                throw new Error(`Data de início inválida: ${startDateStr}`);
              }
              productData.flashSaleStartDate = startDate.toISOString();
              
              // Se houver duração em horas, SEMPRE calcular data fim
              if (editedProduct.flashSaleDurationHours && editedProduct.flashSaleDurationHours > 0) {
                const end = new Date(startDate.getTime() + (editedProduct.flashSaleDurationHours * 60 * 60 * 1000));
                productData.flashSaleEndDate = end.toISOString();
              } else if (editedProduct.flashSaleEndDate) {
                // Garantir que flashSaleEndDate também está em formato ISO
                const endDate = editedProduct.flashSaleEndDate.includes('T') && !editedProduct.flashSaleEndDate.includes('Z') && !editedProduct.flashSaleEndDate.includes('+')
                  ? new Date(editedProduct.flashSaleEndDate + ':00')
                  : new Date(editedProduct.flashSaleEndDate);
                productData.flashSaleEndDate = endDate.toISOString();
              }
            }
          } else {
            productData.isFlashSale = false;
          }
        }

        // Adicionar campos opcionais apenas se tiverem valor válido
        if (editedProduct.colorHex?.trim() && editedProduct.colorHex.trim().length <= 7) {
          productData.colorHex = editedProduct.colorHex.trim();
        }

        if (editedProduct.weight && !isNaN(Number(editedProduct.weight)) && Number(editedProduct.weight) >= 0) {
          productData.weight = Number(editedProduct.weight);
        }

        if (editedProduct.width && !isNaN(Number(editedProduct.width)) && Number(editedProduct.width) >= 0) {
          productData.width = Number(editedProduct.width);
        }

        if (editedProduct.height && !isNaN(Number(editedProduct.height)) && Number(editedProduct.height) >= 0) {
          productData.height = Number(editedProduct.height);
        }

        if (editedProduct.depth && !isNaN(Number(editedProduct.depth)) && Number(editedProduct.depth) >= 0) {
          productData.depth = Number(editedProduct.depth);
        }

        if (editedProduct.style && ['MODERNO', 'MINIMALISTA', 'RUSTICO'].includes(editedProduct.style)) {
          productData.style = editedProduct.style;
        }

        // Adicionar supplierId apenas se for um UUID válido
        if (editedProduct.supplierId && editedProduct.supplierId.trim()) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(editedProduct.supplierId.trim())) {
            productData.supplierId = editedProduct.supplierId.trim();
          } else {
            console.warn('⚠️ SupplierId inválido ignorado:', editedProduct.supplierId);
          }
        }

        console.log('📦 Dados do produto sendo enviados:', JSON.stringify(productData, null, 2));
        console.log('🏪 StoreId:', storeId);
        console.log('🔍 Verificação de campos obrigatórios:', {
          name: !!productData.name,
          category: !!productData.category,
          price: typeof productData.price === 'number' && productData.price >= 0,
          stock: typeof productData.stock === 'number' && productData.stock >= 0,
          storeId: !!productData.storeId
        });
        console.log('🔍 Tipos dos campos:', {
          name: typeof productData.name,
          description: typeof productData.description,
          category: typeof productData.category,
          price: typeof productData.price,
          stock: typeof productData.stock,
          sku: typeof productData.sku,
          colorName: typeof productData.colorName,
          colorHex: typeof productData.colorHex,
          brand: typeof productData.brand,
          weight: typeof productData.weight,
          width: typeof productData.width,
          height: typeof productData.height,
          depth: typeof productData.depth,
          style: typeof productData.style,
          supplierId: typeof productData.supplierId,
          storeId: typeof productData.storeId
        });
        console.log('📋 Valores específicos:', {
          name: productData.name,
          description: productData.description,
          category: productData.category,
          price: productData.price,
          stock: productData.stock,
          sku: productData.sku,
          colorName: productData.colorName,
          colorHex: productData.colorHex,
          brand: productData.brand,
          weight: productData.weight,
          width: productData.width,
          height: productData.height,
          depth: productData.depth,
          style: productData.style,
          supplierId: productData.supplierId
        });
        console.log('🎯 Categoria sendo enviada:', productData.category);
        console.log('🎯 Categoria é string?', typeof productData.category === 'string');
        console.log('🎯 Categoria é válida?', ['SOFA', 'MESA', 'CADEIRA', 'ARMARIO', 'ESTANTE', 'POLTRONA', 'QUADRO', 'LUMINARIA', 'MESA_CENTRO'].includes(productData.category));
        console.log('🎯 StoreId é válido?', productData.storeId && typeof productData.storeId === 'string');
        console.log('🎯 Campos numéricos:', {
          price: productData.price,
          stock: productData.stock,
          weight: productData.weight,
          width: productData.width,
          height: productData.height,
          depth: productData.depth
        });
        
        // Se há imagens novas, usar FormData para enviar com suporte a 3D
        let uploadedImageUrls: string[] = [];
        if (uploadedImages.length > 0) {
          console.log('📤 Enviando produto com', uploadedImages.length, 'imagens via FormData...');
          
          try {
            // Criar FormData para enviar com arquivos
            const formData = new FormData();
            
            // Adicionar campos do produto de forma controlada
            formData.append('name', productData.name);
            formData.append('description', productData.description || '');
            formData.append('category', productData.category);
            formData.append('price', productData.price.toString());
            formData.append('stock', productData.stock.toString());
            formData.append('sku', productData.sku || '');
            formData.append('isAvailable', productData.isAvailable ? 'true' : 'false');
            formData.append('colorName', productData.colorName || '');
            formData.append('brand', productData.brand || '');
            formData.append('storeId', productData.storeId);
            
            // Adicionar campos opcionais apenas se tiverem valor
            if (productData.colorHex) {
              formData.append('colorHex', productData.colorHex);
            }
            if (productData.weight) {
              formData.append('weight', productData.weight.toString());
            }
            if (productData.width) {
              formData.append('width', productData.width.toString());
            }
            if (productData.height) {
              formData.append('height', productData.height.toString());
            }
            if (productData.depth) {
              formData.append('depth', productData.depth.toString());
            }
            if (productData.style) {
              formData.append('style', productData.style);
            }
            if (productData.supplierId) {
              formData.append('supplierId', productData.supplierId);
            }

            // Adicionar campos de oferta no FormData
            if (canManageSales) {
              formData.append('isOnSale', productData.isOnSale ? 'true' : 'false');
              if (productData.salePrice) formData.append('salePrice', productData.salePrice.toString());
              if (productData.saleStartDate) formData.append('saleStartDate', productData.saleStartDate);
              if (productData.saleEndDate) formData.append('saleEndDate', productData.saleEndDate);
              formData.append('isFlashSale', productData.isFlashSale ? 'true' : 'false');
              if (productData.flashSaleDiscountPercent) {
                formData.append('flashSaleDiscountPercent', productData.flashSaleDiscountPercent.toString());
              }
              if (productData.flashSalePrice) formData.append('flashSalePrice', productData.flashSalePrice.toString());
              if (productData.flashSaleStartDate) {
                formData.append('flashSaleStartDate', productData.flashSaleStartDate);
                // SEMPRE garantir que flashSaleEndDate seja salvo se houver duração em horas
                if (productData.flashSaleEndDate) {
                  formData.append('flashSaleEndDate', productData.flashSaleEndDate);
                }
              }
            }
            
            // Adicionar is3D
            if (editedProduct.is3D) {
              formData.append('is3D', 'true');
            }
            
            // Adicionar imagens existentes se houver
            if (existingImages && existingImages.length > 0) {
              existingImages.forEach((url: string) => {
                formData.append('existingImageUrls', url);
              });
            }

            // Adicionar novos arquivos
            uploadedImages.forEach((file) => {
              formData.append('images', file);
            });

            console.log('📦 Enviando FormData com imagens...');

            // Enviar via fetch com FormData
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_BASE_URL}/admin/products`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
              throw new Error(errorData.message || `Erro: ${response.statusText}`);
            }

            result = await response.json();
            console.log('✅ Produto criado com sucesso via FormData:', result);
            
          } catch (uploadError: any) {
            console.error('❌ Erro ao criar produto com imagens:', uploadError);
            toast.error('Erro ao criar produto', {
              description: `Erro: ${uploadError.message || 'Erro desconhecido'}`,
              duration: 6000,
            });
            return;
          }
        } else {
          console.log('ℹ️ Nenhuma imagem nova, criando produto sem FormData');
          // Criar produto sem imagens
          try {
            result = await adminAPI.createProduct(productData);
          } catch (error: any) {
            console.error('🚨 Erro detalhado:', error);
            console.error('🚨 Resposta do servidor:', error.response?.data);
            console.error('🚨 Status:', error.response?.status);
            console.error('🚨 Headers:', error.response?.headers);
            
            // Tratar erros de validação específicos
            if (error.response?.status === 400) {
              const validationErrors = error.response?.data?.message || error.response?.data;
              console.error('🚨 Erros de validação:', validationErrors);
              console.error('🚨 Dados completos da resposta:', error.response?.data);
              
              // Se for um array de erros de validação
              if (Array.isArray(validationErrors)) {
                console.error('🚨 Array de erros:', validationErrors);
                const errorMessages = validationErrors.map((err: any, index: number) => {
                  console.error(`🚨 Erro ${index}:`, err);
                  const property = err.property || err.field || 'campo';
                  const constraints = err.constraints || err.messages || err.message || 'erro desconhecido';
                  const constraintValues = typeof constraints === 'object' ? Object.values(constraints) : [constraints];
                  return `${property}: ${constraintValues.join(', ')}`;
                }).join('\n');
                throw new Error(`Erro de validação:\n${errorMessages}`);
              }
              
              // Se for uma string de erro
              if (typeof validationErrors === 'string') {
                throw new Error(`Erro de validação: ${validationErrors}`);
              }
              
              // Se for um objeto de erro
              if (typeof validationErrors === 'object' && validationErrors !== null) {
                const errorMessages = Object.entries(validationErrors).map(([key, value]) => 
                  `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                ).join('\n');
                throw new Error(`Erro de validação:\n${errorMessages}`);
              }
            }
            
            throw error;
          }
          
          console.log('✅ Produto criado com sucesso:', result);
          console.log('🖼️ Imagens do produto:', result.imageUrls);
          console.log('🖼️ Imagem principal:', result.imageUrl);
          
          toast.success('Produto criado com sucesso!', {
            description: `${editedProduct.name} foi criado.`,
            duration: 4000,
          });
        }
      }
      
      // Modo de edição
      if (actualMode === 'edit') {
        console.log('✅ Entrando no modo de edição');
        if (!editedProduct.id) {
          console.error('❌ Produto não tem ID para edição');
          throw new Error('Produto não encontrado para edição. ID não disponível.');
        }
        // Fazer upload das novas imagens (se houver)
        let newUploadedImageUrls: string[] = [];
        if (uploadedImages.length > 0) {
          console.log('📤 Fazendo upload de', uploadedImages.length, 'novas imagens...');
          try {
            newUploadedImageUrls = await uploadMultipleProductImages(uploadedImages, editedProduct.id);
            console.log('✅ Upload de novas imagens concluído:', newUploadedImageUrls);
          } catch (uploadError) {
            console.error('❌ Erro no upload de novas imagens:', uploadError);
            toast.error('Erro no upload de imagens', {
              description: 'As novas imagens não puderam ser enviadas. Tente novamente.',
              duration: 4000,
            });
            return;
          }
        }

        // Para edição, manter o modelo 3D existente ou deixar indefinido
        // A geração de 3D na edição pode ser implementada depois se necessário
        let updatedModel3DUrl = product?.model3DUrl;

        // Atualizar produto existente
        try {
          const updateData: any = {
            name: editedProduct.name,
            description: editedProduct.description,
            category: editedProduct.category,
            price: editedProduct.price,
            stock: editedProduct.stock,
            sku: editedProduct.sku,
            isActive: editedProduct.isActive,
            colorName: editedProduct.colorName,
            colorHex: editedProduct.colorHex,
            brand: editedProduct.brand,
            supplierId: editedProduct.supplierId,
            width: editedProduct.width,
            height: editedProduct.height,
            depth: editedProduct.depth,
            weight: editedProduct.weight,
            style: editedProduct.style,
            imageUrls: [...existingImages, ...newUploadedImageUrls],
            model3DUrl: updatedModel3DUrl, // Incluir modelo 3D atualizado
          };

          // Adicionar campos de oferta apenas se o usuário tiver permissão
          if (canManageSales) {
            updateData.isOnSale = editedProduct.isOnSale || false;
            if (editedProduct.salePrice) updateData.salePrice = Number(editedProduct.salePrice);
            if (editedProduct.saleStartDate) updateData.saleStartDate = editedProduct.saleStartDate;
            if (editedProduct.saleEndDate) updateData.saleEndDate = editedProduct.saleEndDate;
            updateData.isFlashSale = editedProduct.isFlashSale || false;
            // Salvar percentual de desconto se houver
            if (editedProduct.flashSaleDiscountPercent) {
              updateData.flashSaleDiscountPercent = Number(editedProduct.flashSaleDiscountPercent);
              // Calcular preço baseado no percentual
              if (editedProduct.price) {
                const discount = (editedProduct.price * editedProduct.flashSaleDiscountPercent) / 100;
                updateData.flashSalePrice = editedProduct.price - discount;
              }
            } else if (editedProduct.flashSalePrice) {
              updateData.flashSalePrice = Number(editedProduct.flashSalePrice);
            }
            // Sempre garantir que há data início e fim
            if (editedProduct.flashSaleStartDate) {
              // Converter para formato ISO completo se necessário
              // O input datetime-local retorna formato "YYYY-MM-DDTHH:mm" sem segundos e timezone
              const startDateStr = editedProduct.flashSaleStartDate;
              let startDate: Date;
              if (startDateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                // Formato datetime-local: criar Date usando componentes no timezone local
                const [datePart, timePart] = startDateStr.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes] = timePart.split(':').map(Number);
                // Usar construtor Date com componentes (sempre usa timezone local)
                startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
              } else {
                startDate = new Date(startDateStr);
              }
              // Garantir formato ISO completo (com segundos e timezone)
              if (isNaN(startDate.getTime())) {
                throw new Error(`Data de início inválida: ${startDateStr}`);
              }
              updateData.flashSaleStartDate = startDate.toISOString();
              
              // Se houver duração em horas, SEMPRE calcular data fim
              if (editedProduct.flashSaleDurationHours && editedProduct.flashSaleDurationHours > 0) {
                const end = new Date(startDate.getTime() + (editedProduct.flashSaleDurationHours * 60 * 60 * 1000));
                updateData.flashSaleEndDate = end.toISOString();
              } else if (editedProduct.flashSaleEndDate) {
                // Garantir que flashSaleEndDate também está em formato ISO
                const endDate = editedProduct.flashSaleEndDate.includes('T') && !editedProduct.flashSaleEndDate.includes('Z') && !editedProduct.flashSaleEndDate.includes('+')
                  ? new Date(editedProduct.flashSaleEndDate + ':00')
                  : new Date(editedProduct.flashSaleEndDate);
                updateData.flashSaleEndDate = endDate.toISOString();
              }
            }
          }

          result = await adminAPI.updateProduct(editedProduct.id, updateData);
          
          toast.success('Produto atualizado com sucesso!', {
            description: `${editedProduct.name} foi atualizado.`,
            duration: 4000,
          });
        } catch (error: any) {
          console.error('🚨 Erro ao atualizar produto:', error);
          throw error;
        }
      }

      if (!result) {
        console.error('❌ Nenhuma operação foi realizada');
        console.error('❌ Modo prop:', mode);
        console.error('❌ Modo real:', actualMode);
        console.error('❌ isEditing:', isEditing);
        console.error('❌ editedProduct:', editedProduct);
        console.error('❌ editedProduct.id:', editedProduct?.id);
        throw new Error(`Nenhuma operação foi realizada. Modo prop: ${mode}, Modo real: ${actualMode}, isEditing: ${isEditing}, ID: ${editedProduct?.id || 'não disponível'}`);
      }

      onProductUpdated(result);
      setIsEditing(false);
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      
      // Exibir erro específico se disponível
      const errorMessage = error.message || 'Erro desconhecido';
      const isValidationError = errorMessage.includes('validação') || errorMessage.includes('validation');
      
      toast.error('Erro ao salvar produto', {
        description: isValidationError ? errorMessage : 'Tente novamente mais tarde.',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (!confirm(`Tem certeza que deseja excluir o produto "${product?.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await adminAPI.deleteProduct(product?.id);
      onProductDeleted(product?.id);
      onClose();
      toast.success('Produto excluído com sucesso!', {
        description: `${product?.name} foi removido do catálogo.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setEditedProduct({ ...product });
    }
    setIsEditing(false);
  };

  const handleImagesChange = (files: File[]) => {
    setUploadedImages(files);
  };

  const testSupabaseConnection = async () => {
    console.log('🧪 Testando conexão com Supabase...');
    
    if (!supabase) {
      console.error('❌ Supabase não está configurado');
      toast.error('Supabase não configurado', {
        description: 'Verifique as variáveis de ambiente',
        duration: 4000,
      });
      return;
    }

    try {
      // Pular listagem de buckets (pode ter problema de permissão)
      console.log('🔄 Testando acesso direto ao bucket...');
      
      // Testar listagem de arquivos no bucket diretamente
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 10 });

      if (filesError) {
        console.error('❌ Erro ao listar arquivos:', filesError);
        console.error('❌ Detalhes do erro:', {
          message: filesError.message,
          name: filesError.name
        });
        
        // Se der erro de permissão, tentar pasta raiz
        console.log('🔄 Tentando listar pasta raiz...');
        const { data: rootFiles, error: rootError } = await supabase.storage
          .from('product-images')
          .list('', { limit: 10 });
          
        if (rootError) {
          console.error('❌ Erro na pasta raiz:', rootError);
          toast.error('Erro de permissão', {
            description: 'Não foi possível acessar o bucket. Verifique as políticas de segurança.',
            duration: 6000,
          });
          return;
        }
        
        console.log('✅ Arquivos na pasta raiz:', rootFiles);
        toast.success('Conexão com Supabase OK!', {
          description: `Bucket acessível. ${rootFiles?.length || 0} arquivos na raiz.`,
          duration: 4000,
        });
        return;
      }

      console.log('✅ Arquivos no bucket:', files);
      
      toast.success('Conexão com Supabase OK!', {
        description: `Bucket encontrado. ${files?.length || 0} arquivos.`,
        duration: 4000,
      });

    } catch (error: any) {
      console.error('❌ Erro geral no teste:', error);
      toast.error('Erro no teste', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  const handleRemoveExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Eye className="h-6 w-6 text-green-600" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Novo Produto' : isEditing ? 'Editar Produto' : 'Visualizar Produto'}
            </h2>
          </div>
            <div className="flex items-center space-x-2">
            {isEditing && (
              <>

                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isLoading} className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
            {!isEditing && (
              <>
                <Button onClick={() => setIsEditing(true)} className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDelete} 
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div 
                className="relative aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  const allImages = [
                    ...existingImages, 
                    ...uploadedImages.map(file => URL.createObjectURL(file)),
                    ...(editedProduct?.imageUrls || [])
                  ];
                  if (allImages.length > 0) {
                    setIsCarouselOpen(true);
                  }
                }}
              >
                {(existingImages.length > 0 || uploadedImages.length > 0 || (editedProduct?.imageUrls && editedProduct.imageUrls.length > 0)) ? (
                  <img
                    src={
                      existingImages.length > 0 
                        ? existingImages[0] 
                        : uploadedImages.length > 0 
                        ? URL.createObjectURL(uploadedImages[0])
                        : editedProduct?.imageUrls?.[0]
                    }
                    alt={editedProduct?.name || 'Produto'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {/* Indicador de múltiplas imagens */}
                {((existingImages.length + uploadedImages.length + (editedProduct?.imageUrls?.length || 0)) > 1) && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {existingImages.length + uploadedImages.length + (editedProduct?.imageUrls?.length || 0)} imagens
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="mt-4">
                  <ImageUpload
                    images={uploadedImages}
                    onImagesChange={handleImagesChange}
                    maxImages={5}
                    existingImages={existingImages}
                    onRemoveExisting={handleRemoveExistingImage}
                  />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Tag className="h-5 w-5 mr-2" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome do Produto *
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedProduct?.name || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Nome do produto"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold text-gray-900">{product?.name || 'Novo Produto'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Descrição
                    </Label>
                    {isEditing ? (
                      <textarea
                        id="description"
                        value={editedProduct?.description || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Descrição do produto"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product?.description || 'Sem descrição'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Categoria *
                    </Label>
                    {isEditing ? (
                      <select
                        id="category"
                        value={editedProduct?.category || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, category: e.target.value } : null)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">{product?.category}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sku" className="text-sm font-medium text-gray-700">
                      SKU
                    </Label>
                    {isEditing ? (
                      <Input
                        id="sku"
                        value={editedProduct?.sku || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, sku: e.target.value } : null)}
                        placeholder="Código SKU"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product?.sku || 'Sem SKU'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                      Marca
                    </Label>
                    {isEditing ? (
                      <Input
                        id="brand"
                        value={editedProduct?.brand || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, brand: e.target.value } : null)}
                        placeholder="Marca do produto"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product?.brand || 'Sem marca'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing and Stock */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Preço e Estoque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Preço *
                    </Label>
                    {isEditing ? (
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editedProduct?.price || 0}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-2xl font-bold text-[#3e2626]">
                        {formatPrice(product?.price)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                      Estoque
                    </Label>
                    {isEditing ? (
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={editedProduct?.stock || 0}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                        placeholder="0"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product?.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product?.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product?.stock} unidades
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    {isEditing ? (
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedProduct?.isActive || false}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, isActive: e.target.checked } : null)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Produto Ativo</span>
                        </label>
                        <label className="flex items-center ml-4">
                          <input
                            type="checkbox"
                            checked={editedProduct?.is3D || false}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, is3D: e.target.checked } : null)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Gerar Modelo 3D</span>
                        </label>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product?.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        {product?.model3DUrl && (
                          <span className="ml-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            3D Disponível
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sales Section - Apenas para ADMIN e STORE_MANAGER */}
              {canManageSales && (
                <Card className="border-2 border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center text-lg text-blue-900">
                      <Percent className="h-5 w-5 mr-2 text-blue-600" />
                      Ofertas e Promoções
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Configure ofertas normais e relâmpago para este produto aparecer na loja
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Oferta Normal */}
                    <div className="border-2 border-green-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Tag className="h-5 w-5 text-green-600" />
                          <Label className="text-base font-bold text-gray-900">
                            Oferta Normal
                          </Label>
                        </div>
                        {isEditing ? (
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={editedProduct?.isOnSale || false}
                              onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, isOnSale: e.target.checked } : null)}
                              className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                              {editedProduct?.isOnSale ? 'Ativa' : 'Ativar Oferta'}
                            </span>
                          </label>
                        ) : (
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                            product?.isOnSale ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {product?.isOnSale ? '✓ Ativa' : 'Inativa'}
                          </span>
                        )}
                      </div>

                      {((isEditing && editedProduct?.isOnSale) || (!isEditing && product?.isOnSale)) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="salePrice" className="text-sm font-medium text-gray-700">
                              Preço de Oferta
                            </Label>
                            {isEditing ? (
                              <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <Input
                                  id="salePrice"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editedProduct?.salePrice || ''}
                                  onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, salePrice: parseFloat(e.target.value) || undefined } : null)}
                                  placeholder="0.00"
                                  className="pl-10"
                                />
                              </div>
                            ) : (
                              <p className="mt-1 text-lg font-semibold text-[#3e2626]">
                                {product?.salePrice ? formatPrice(product.salePrice) : '-'}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="saleStartDate" className="text-sm font-medium text-gray-700">
                              Data Início
                            </Label>
                            {isEditing ? (
                              <Input
                                id="saleStartDate"
                                type="datetime-local"
                                value={editedProduct?.saleStartDate 
                                  ? (typeof editedProduct.saleStartDate === 'string' 
                                      ? editedProduct.saleStartDate.slice(0, 16)
                                      : new Date(editedProduct.saleStartDate).toISOString().slice(0, 16))
                                  : ''}
                                onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, saleStartDate: e.target.value } : null)}
                                className="mt-1"
                              />
                            ) : (
                              <div className="mt-1">
                                {product?.saleStartDate ? (
                                  <div className="flex flex-col">
                                    <p className="text-gray-900 font-medium">
                                      {new Date(product.saleStartDate).toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(product.saleStartDate).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic">Não definida</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="saleEndDate" className="text-sm font-medium text-gray-700">
                              Data Fim
                            </Label>
                            {isEditing ? (
                              <Input
                                id="saleEndDate"
                                type="datetime-local"
                                value={editedProduct?.saleEndDate 
                                  ? (typeof editedProduct.saleEndDate === 'string' 
                                      ? editedProduct.saleEndDate.slice(0, 16)
                                      : new Date(editedProduct.saleEndDate).toISOString().slice(0, 16))
                                  : ''}
                                onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, saleEndDate: e.target.value } : null)}
                                className="mt-1"
                              />
                            ) : (
                              <div className="mt-1">
                                {product?.saleEndDate ? (
                                  <div className="flex flex-col">
                                    <p className="text-gray-900 font-medium">
                                      {new Date(product.saleEndDate).toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(product.saleEndDate).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic">Não definida</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Oferta Relâmpago */}
                    <div className="border-2 border-yellow-300 rounded-xl p-5 space-y-4 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-6 w-6 text-yellow-600 fill-yellow-400 animate-pulse" />
                          <Label className="text-base font-bold text-gray-900">
                            Oferta Relâmpago
                          </Label>
                          <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                            DESTAQUE
                          </span>
                        </div>
                        {isEditing ? (
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={editedProduct?.isFlashSale || false}
                              onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, isFlashSale: e.target.checked } : null)}
                              className="mr-2 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-700">
                              {editedProduct?.isFlashSale ? 'Ativa' : 'Ativar Relâmpago'}
                            </span>
                          </label>
                        ) : (
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                            product?.isFlashSale ? 'bg-yellow-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {product?.isFlashSale ? '⚡ Ativa' : 'Inativa'}
                          </span>
                        )}
                      </div>

                      {/* Sempre mostrar campos quando estiver editando, ou quando estiver visualizando e a oferta estiver ativa */}
                      {(isEditing || (!isEditing && product?.isFlashSale)) && (
                        <div className="space-y-4">
                          {/* Aviso sobre duração em horas */}
                          {isEditing && (
                            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                              <p className="text-xs text-yellow-800 font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Oferta Relâmpago funciona em HORAS. Configure a data/hora de início e a duração em horas.</span>
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Tipo de Desconto
                              </Label>
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditedProduct((prev: any) => prev ? { ...prev, flashSaleDiscountType: 'percent' } : null)}
                                    className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                      editedProduct?.flashSaleDiscountType === 'percent' || !editedProduct?.flashSaleDiscountType
                                        ? 'bg-yellow-500 text-white border-yellow-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-400'
                                    }`}
                                  >
                                    Porcentagem (%)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditedProduct((prev: any) => prev ? { ...prev, flashSaleDiscountType: 'fixed' } : null)}
                                    className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                      editedProduct?.flashSaleDiscountType === 'fixed'
                                        ? 'bg-yellow-500 text-white border-yellow-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-400'
                                    }`}
                                  >
                                    Preço Fixo
                                  </button>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm text-gray-600">
                                  {product?.flashSaleDiscountPercent ? 'Porcentagem' : 'Preço Fixo'}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="flashSaleDiscount" className="text-sm font-medium text-gray-700">
                                {isEditing && (editedProduct?.flashSaleDiscountType === 'percent' || !editedProduct?.flashSaleDiscountType)
                                  ? 'Desconto (%)'
                                  : 'Preço Relâmpago (R$)'}
                              </Label>
                              {isEditing ? (
                                <div className="relative mt-1">
                                  {editedProduct?.flashSaleDiscountType === 'percent' || !editedProduct?.flashSaleDiscountType ? (
                                    <>
                                      <Input
                                        id="flashSaleDiscountPercent"
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="99"
                                        value={editedProduct?.flashSaleDiscountPercent ?? ''}
                                        onChange={(e) => {
                                          const percent = parseInt(e.target.value) || undefined;
                                          setEditedProduct((prev: any) => {
                                            if (!prev) return null;
                                            const newProduct = { ...prev, flashSaleDiscountPercent: percent };
                                            // Calcular preço baseado no percentual
                                            if (percent && prev.price) {
                                              const discount = (prev.price * percent) / 100;
                                              newProduct.flashSalePrice = prev.price - discount;
                                            }
                                            return newProduct;
                                          });
                                        }}
                                        placeholder="Ex: 30"
                                        className="pr-12 h-14 text-lg font-semibold px-4"
                                        autoComplete="off"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-gray-600 font-semibold pointer-events-none">%</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">R$</span>
                                      <Input
                                        id="flashSalePrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editedProduct?.flashSalePrice || ''}
                                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, flashSalePrice: parseFloat(e.target.value) || undefined } : null)}
                                        placeholder="0.00"
                                        className="pl-10 h-14 text-lg font-semibold px-4"
                                        autoComplete="off"
                                      />
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-lg font-semibold text-yellow-600">
                                  {product?.flashSaleDiscountPercent 
                                    ? `${product.flashSaleDiscountPercent}% OFF`
                                    : product?.flashSalePrice 
                                    ? formatPrice(product.flashSalePrice) 
                                    : '-'}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="flashSaleStartDate" className="text-sm font-medium text-gray-700">
                                Data/Hora Início
                              </Label>
                              {isEditing ? (
                                <Input
                                  id="flashSaleStartDate"
                                  type="datetime-local"
                                  value={editedProduct?.flashSaleStartDate 
                                    ? (typeof editedProduct.flashSaleStartDate === 'string' 
                                        ? editedProduct.flashSaleStartDate.slice(0, 16)
                                        : new Date(editedProduct.flashSaleStartDate).toISOString().slice(0, 16))
                                    : ''}
                                  onChange={(e) => {
                                    const startDate = e.target.value;
                                    setEditedProduct((prev: any) => {
                                      if (!prev) return null;
                                      const newProduct = { ...prev, flashSaleStartDate: startDate };
                                      // Se houver duração em horas, calcular data fim automaticamente
                                      if (startDate && prev.flashSaleDurationHours) {
                                        const start = new Date(startDate);
                                        const end = new Date(start.getTime() + (prev.flashSaleDurationHours * 60 * 60 * 1000));
                                        newProduct.flashSaleEndDate = end.toISOString();
                                      }
                                      return newProduct;
                                    });
                                  }}
                                  className="mt-1 h-12 text-base"
                                />
                              ) : (
                                <div className="mt-1">
                                  {product?.flashSaleStartDate ? (
                                    <div className="flex flex-col">
                                      <p className="text-gray-900 font-medium">
                                        {new Date(product.flashSaleStartDate).toLocaleDateString('pt-BR', { 
                                          day: '2-digit', 
                                          month: '2-digit', 
                                          year: 'numeric' 
                                        })}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {new Date(product.flashSaleStartDate).toLocaleTimeString('pt-BR', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 italic">Não definida</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="flashSaleDurationHours" className="text-sm font-medium text-gray-700">
                                Duração (Horas)
                              </Label>
                              {isEditing ? (
                                <div className="relative mt-1">
                                  <Input
                                    id="flashSaleDurationHours"
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="168"
                                    value={editedProduct?.flashSaleDurationHours ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const hours = value === '' ? undefined : parseInt(value);
                                      setEditedProduct((prev: any) => {
                                        if (!prev) return null;
                                        const newProduct = { ...prev, flashSaleDurationHours: hours };
                                        // Calcular data fim automaticamente baseado na data início + horas
                                        if (prev.flashSaleStartDate && hours && hours > 0) {
                                          const start = new Date(prev.flashSaleStartDate);
                                          const end = new Date(start.getTime() + (hours * 60 * 60 * 1000));
                                          newProduct.flashSaleEndDate = end.toISOString();
                                        }
                                        return newProduct;
                                      });
                                    }}
                                    placeholder="Ex: 24"
                                    className="pr-24 h-14 text-lg font-semibold px-4"
                                    autoComplete="off"
                                    style={{ fontSize: '18px', paddingRight: '80px' }}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-gray-600 font-semibold pointer-events-none">horas</span>
                                </div>
                              ) : (
                                <div className="mt-1">
                                  {product?.flashSaleStartDate && product?.flashSaleEndDate ? (
                                    <div className="flex flex-col">
                                      <p className="text-gray-900 font-medium">
                                        {Math.round((new Date(product.flashSaleEndDate).getTime() - new Date(product.flashSaleStartDate).getTime()) / (1000 * 60 * 60))} horas
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Termina: {new Date(product.flashSaleEndDate).toLocaleString('pt-BR', { 
                                          day: '2-digit', 
                                          month: '2-digit', 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 italic">Não definida</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Exibir data fim calculada (somente leitura) */}
                          {isEditing && editedProduct?.flashSaleStartDate && editedProduct?.flashSaleDurationHours && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs text-blue-800">
                                <strong>Data/Hora Fim calculada:</strong>{' '}
                                {editedProduct.flashSaleEndDate 
                                  ? new Date(editedProduct.flashSaleEndDate).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Calculando...'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Hash className="h-5 w-5 mr-2" />
                    Especificações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="colorName" className="text-sm font-medium text-gray-700">
                      Nome da Cor
                    </Label>
                    {isEditing ? (
                      <Input
                        id="colorName"
                        value={editedProduct?.colorName || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, colorName: e.target.value } : null)}
                        placeholder="Nome da cor"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product?.colorName || 'Não especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="supplierId" className="text-sm font-medium text-gray-700">
                      Fornecedor
                    </Label>
                    {isEditing ? (
                      <Input
                        id="supplierId"
                        value={editedProduct?.supplierId || ''}
                        onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, supplierId: e.target.value } : null)}
                        placeholder="ID do fornecedor"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product?.supplier?.name || product?.supplierId || 'Não especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Dimensões
                    </Label>
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div>
                          <Input
                            id="width"
                            value={editedProduct?.width || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, width: e.target.value } : null)}
                            placeholder="Largura (cm)"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Input
                            id="height"
                            value={editedProduct?.height || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, height: e.target.value } : null)}
                            placeholder="Altura (cm)"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Input
                            id="depth"
                            value={editedProduct?.depth || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, depth: e.target.value } : null)}
                            placeholder="Profundidade (cm)"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-600">
                        {product?.width && product?.height && product?.depth 
                          ? `${product.width}cm x ${product.height}cm x ${product.depth}cm`
                          : 'Não especificado'
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                      Peso
                    </Label>
                    {isEditing ? (
                      <div className="relative mt-1">
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editedProduct?.weight || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, weight: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="Ex: 25.5"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">kg</span>
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-600">
                        {product?.weight ? `${product.weight}kg` : 'Não especificado'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Carrossel de imagens */}
      <ImageCarousel
        images={[
          ...existingImages, 
          ...uploadedImages.map(file => URL.createObjectURL(file)),
          ...(editedProduct?.imageUrls || [])
        ]}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />
    </div>
  );
}
