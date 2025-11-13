"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerAPI } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { showConfirm } from "@/lib/alerts";

interface Address {
  id: string;
  name: string;
  recipientName: string;
  phone: string;
  cpf?: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  isFromUserProfile?: boolean; // Indica se vem do perfil do usuário
}

export function AddressSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    recipientName: "",
    phone: "",
    cpf: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false,
  });

  // Carregar endereços do banco
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const { user } = useAppStore.getState();
      
      // Buscar endereços apenas da tabela users
      const userAddresses: Address[] = [];
      
      if (user && user.address && user.city && user.state) {
        // Extrair número do endereço se existir
        const addressParts = user.address.split(',').map((s: string) => s.trim());
        const lastPart = addressParts[addressParts.length - 1];
        const numberMatch = lastPart.match(/\d+/);
        const number = numberMatch ? numberMatch[0] : '';
        const street = numberMatch ? user.address.replace(`, ${number}`, '').replace(number, '').trim() : user.address;

        userAddresses.push({
          id: `user-profile-${user.id}`,
          name: "Endereço Principal",
          recipientName: user.name || "",
          phone: user.phone || "",
          cpf: user.cpf || undefined,
          address: street,
          number: number || "",
          complement: "",
          neighborhood: "",
          city: user.city,
          state: user.state,
          zipCode: user.zipCode || "",
          isDefault: true,
          isFromUserProfile: true,
        });
      }

      setAddresses(userAddresses);
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Atualizar endereço no perfil do usuário
      const { user } = useAppStore.getState();
      if (!user) {
        alert("Usuário não encontrado.");
        return;
      }

      // Combinar endereço e número
      const fullAddress = formData.number 
        ? `${formData.address}, ${formData.number}` 
        : formData.address;

      // Atualizar perfil do usuário
      const updatedUser = await customerAPI.updateProfile({
        address: fullAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.phone,
      });
      
      // Atualizar store local com os dados retornados do servidor
      if (updatedUser) {
        useAppStore.getState().setUser({
          ...user,
          ...updatedUser,
        });
      } else {
        // Fallback: atualizar apenas os campos que enviamos
        useAppStore.getState().setUser({
          ...user,
          address: fullAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone,
        });
      }
      
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      await loadAddresses(); // Recarregar lista
      
      // Feedback visual de sucesso
      toast.success("Endereço atualizado com sucesso!", {
        description: "As alterações foram salvas.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar endereço:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Erro desconhecido";
      toast.error("Erro ao salvar endereço", {
        description: errorMessage,
      });
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      recipientName: address.recipientName,
      phone: address.phone,
      cpf: address.cpf || "",
      address: address.address,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, isFromUserProfile?: boolean) => {
    // Endereços do perfil não podem ser excluídos, apenas limpos
    if (isFromUserProfile) {
      const confirmed = await showConfirm("Deseja remover o endereço do seu perfil?");
      if (confirmed) {
        try {
          const { user } = useAppStore.getState();
          if (!user) return;

          await customerAPI.updateProfile({
            address: null,
            city: null,
            state: null,
            zipCode: null,
          });

          useAppStore.getState().setUser({
            ...user,
            address: undefined,
            city: undefined,
            state: undefined,
            zipCode: undefined,
          });

          await loadAddresses();
          toast.success("Endereço removido com sucesso!");
        } catch (error: any) {
          console.error("Erro ao remover endereço:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Erro desconhecido";
          toast.error("Erro ao remover endereço", {
            description: errorMessage,
          });
        }
      }
      return;
    }
  };

  const handleSetDefault = async (id: string) => {
    // Como só temos um endereço (do perfil), ele já é o padrão
    // Esta função não é mais necessária, mas mantida para compatibilidade
  };

  const resetForm = () => {
    setFormData({
      name: "",
      recipientName: "",
      phone: "",
      cpf: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      isDefault: false,
    });
  };

  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipCode(e.target.value);
    setFormData({ ...formData, zipCode: formatted });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Meus endereços</h2>
          <p className="text-sm text-gray-500">Gerencie seus endereços de entrega</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAddress(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Inserir novo endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Editar Endereço" : "Adicionar Novo Endereço"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do seu endereço
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Apelido do Endereço</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Casa, Trabalho, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientName">Nome do Destinatário</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="Nome completo do destinatário"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF (Opcional)</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Rua/Avenida</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nome da rua ou avenida"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento (Opcional)</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Nome do bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Nome da cidade"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="AP">Amapá</SelectItem>
                      <SelectItem value="AM">Amazonas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="DF">Distrito Federal</SelectItem>
                      <SelectItem value="ES">Espírito Santo</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="MA">Maranhão</SelectItem>
                      <SelectItem value="MT">Mato Grosso</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PA">Pará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="PI">Piauí</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="RO">Rondônia</SelectItem>
                      <SelectItem value="RR">Roraima</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                      <SelectItem value="TO">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleZipCodeChange}
                  placeholder="00000-000"
                  maxLength={9}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-[#3e2626] border-gray-300 rounded focus:ring-[#3e2626]"
                />
                <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                  Definir como endereço padrão
                </Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#3e2626] hover:bg-[#5a3a3a]">
                  {editingAddress ? "Salvar Alterações" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#3e2626] border-t-transparent"></div>
          <p className="text-gray-500 text-center mt-4 font-medium">Carregando endereços...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
          <p className="text-gray-500 text-center max-w-md">
            Adicione um endereço para facilitar suas compras e entregas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="relative border-2 border-gray-200 rounded-xl p-6 hover:border-[#3e2626] hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50"
            >
              {/* Badges no topo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{address.name}</h3>
                  {address.isDefault && (
                    <span className="px-3 py-1 text-xs font-semibold bg-[#3e2626] text-white rounded-full shadow-sm">
                      Padrão
                    </span>
                  )}
                  {address.isFromUserProfile && (
                    <span className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full shadow-sm">
                      Do Perfil
                    </span>
                  )}
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    className="h-8 w-8 p-0 text-[#3e2626] hover:text-white hover:bg-[#3e2626] rounded-lg transition-all"
                    title="Editar endereço"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address.id, address.isFromUserProfile)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                    title="Remover endereço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Informações do destinatário */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-[#3e2626]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                      Destinatário
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{address.recipientName}</p>
                  </div>
                </div>
                
                {address.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-500">Telefone:</span>
                    <span className="font-medium">{address.phone}</span>
                  </div>
                )}
              </div>

              {/* Endereço completo */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="text-sm text-gray-900 font-medium leading-relaxed">
                    <p className="mb-1">
                      {address.address}
                      {address.number && `, ${address.number}`}
                      {address.complement && ` - ${address.complement}`}
                    </p>
                    <p className="text-gray-600">
                      {address.neighborhood && `${address.neighborhood}, `}
                      {address.city} - {address.state}
                    </p>
                    {address.zipCode && (
                      <p className="text-gray-500 text-xs mt-1">CEP: {address.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão definir como padrão (se não for padrão e não for do perfil) */}
              {!address.isDefault && !address.isFromUserProfile && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    className="w-full text-sm border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white transition-all"
                  >
                    Definir como padrão
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

