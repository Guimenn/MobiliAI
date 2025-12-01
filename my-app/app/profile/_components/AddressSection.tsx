"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Edit, Trash2, Phone } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const { user } = useAppStore();
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

  // Recarregar endereços quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user?.address, user?.city, user?.state, user?.zipCode]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      
      // Buscar endereços apenas da tabela users
      const userAddresses: Address[] = [];
      
      // Exibir endereço se tiver pelo menos endereço, cidade e estado
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
      if (!user) {
        toast.error("Usuário não encontrado. Faça login novamente.");
        return;
      }

      // Combinar endereço e número
      const fullAddress = formData.number 
        ? `${formData.address}, ${formData.number}` 
        : formData.address;

      // Atualizar perfil do usuário (também atualizar o nome se fornecido)
      const updateData: any = {
        address: fullAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      };

      // Se o telefone foi fornecido, atualizar
      if (formData.phone) {
        updateData.phone = formData.phone;
      }

      // Se o nome do destinatário foi fornecido e é diferente do nome atual, atualizar
      if (formData.recipientName && formData.recipientName !== user.name) {
        updateData.name = formData.recipientName;
      }

      const updatedUser = await customerAPI.updateProfile(updateData);
      
      // Atualizar store local com os dados retornados do servidor
      const currentUser = useAppStore.getState().user;
      if (updatedUser && currentUser) {
        useAppStore.getState().setUser({
          ...currentUser,
          ...updatedUser,
        });
      } else if (currentUser) {
        // Fallback: atualizar apenas os campos que enviamos
        useAppStore.getState().setUser({
          ...currentUser,
          ...updateData,
        });
      }
      
      // Recarregar lista de endereços após atualizar
      await loadAddresses();
      
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      
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
    
    // Preencher o formulário com os dados do endereço
    setFormData({
      name: address.name || "Endereço Principal",
      recipientName: address.recipientName || user?.name || "",
      phone: address.phone || user?.phone || "",
      cpf: address.cpf || user?.cpf || "",
      address: address.address,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood || "",
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
    // Preencher com dados do usuário se disponíveis
    setFormData({
      name: "Endereço Principal",
      recipientName: user?.name || "",
      phone: user?.phone || "",
      cpf: user?.cpf || "",
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
    <>
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Meus endereços</CardTitle>
              <CardDescription className="mt-1">
                Gerencie seus endereços de entrega
              </CardDescription>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (open && !editingAddress) {
                  // Quando abrir para criar novo endereço, preencher com dados do usuário
                  resetForm();
                } else if (!open) {
                  setEditingAddress(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
                  onClick={() => {
                    setEditingAddress(null);
                    resetForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Inserir novo endereço
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
                    <SelectTrigger id="state" className="w-full">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent className="z-[1002]" position="popper">
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
        </CardHeader>

      <CardContent>
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
              <Card
                key={address.id}
                className="relative hover:shadow-lg transition-all duration-300 border-gray-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {address.name}
                      </CardTitle>
                      {address.isDefault && (
                        <Badge className="bg-[#3e2626] text-white hover:bg-[#5a3a3a]">
                          Padrão
                        </Badge>
                      )}
                      {address.isFromUserProfile && (
                        <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
                          Do Perfil
                        </Badge>
                      )}
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(address)}
                        className="h-8 w-8 p-0 text-[#3e2626] hover:text-white hover:bg-[#3e2626]"
                        title="Editar endereço"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id, address.isFromUserProfile)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-white hover:bg-red-600"
                        title="Remover endereço"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Informações do destinatário */}
                  <div className="space-y-3 pb-4 border-b border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#3e2626]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-[#3e2626]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                          Destinatário
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{address.recipientName}</p>
                      </div>
                    </div>
                    
                    {address.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 ml-[52px]">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Telefone:</span>
                        <span className="font-medium">{address.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Endereço completo */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-900 leading-relaxed">
                      <p className="mb-1 font-medium">
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

                  {/* Botão definir como padrão (se não for padrão e não for do perfil) */}
                  {!address.isDefault && !address.isFromUserProfile && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="w-full text-sm border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                      >
                        Definir como padrão
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      </Card>
    </>
  );
}

