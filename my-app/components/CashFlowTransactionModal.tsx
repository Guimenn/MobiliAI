'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, ArrowUp, ArrowDown } from 'lucide-react';

import { Loader } from '@/components/ui/ai/loader';
interface CashFlowTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    category?: string;
    date?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORIES = {
  INCOME: [
    { value: 'SALE', label: 'Venda' },
    { value: 'SERVICE', label: 'Serviço' },
    { value: 'REFUND', label: 'Reembolso' },
    { value: 'OTHER', label: 'Outro' },
  ],
  EXPENSE: [
    { value: 'SALARY', label: 'Salário' },
    { value: 'SUPPLIER', label: 'Fornecedor' },
    { value: 'RENT', label: 'Aluguel' },
    { value: 'UTILITIES', label: 'Utilidades' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'MAINTENANCE', label: 'Manutenção' },
    { value: 'OTHER', label: 'Outro' },
  ],
};

export default function CashFlowTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: CashFlowTransactionModalProps) {
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: 'INCOME',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Reset category when type changes
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

  if (!isOpen) return null;

  const categories = formData.type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#3e2626] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                {formData.type === 'INCOME' ? (
                  <ArrowUp className="h-6 w-6" />
                ) : (
                  <ArrowDown className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Nova Transação</h2>
                <p className="text-sm text-white/90 mt-0.5">
                  {formData.type === 'INCOME' ? 'Registrar entrada' : 'Registrar saída'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Tipo de Transação */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Tipo de Transação *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.type === 'INCOME' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('type', 'INCOME')}
                  className={`h-12 ${formData.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  disabled={isLoading}
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'EXPENSE' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('type', 'EXPENSE')}
                  className={`h-12 ${formData.type === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                  disabled={isLoading}
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Despesa
                </Button>
              </div>
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="amount" className="text-sm font-semibold text-gray-700 mb-2 block">
                Valor *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">R$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`pl-12 ${errors.amount ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                Descrição *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva a transação..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
                Categoria *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>

            {/* Data */}
            <div>
              <Label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2 block">
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Transação
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

