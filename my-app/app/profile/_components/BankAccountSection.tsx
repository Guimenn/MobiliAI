"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
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

interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  agency: string;
  accountNumber: string;
  accountHolder: string;
}

export function BankAccountSection() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountType: "",
    agency: "",
    accountNumber: "",
    accountHolder: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica de salvamento
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...formData,
    };
    setAccounts([...accounts, newAccount]);
    setIsDialogOpen(false);
    setFormData({
      bankName: "",
      accountType: "",
      agency: "",
      accountNumber: "",
      accountHolder: "",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Minhas Contas Bancárias</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Conta Bancária
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Conta Bancária</DialogTitle>
              <DialogDescription>
                Preencha os dados da sua conta bancária
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Banco</Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banco-do-brasil">Banco do Brasil</SelectItem>
                    <SelectItem value="caixa">Caixa Econômica Federal</SelectItem>
                    <SelectItem value="bradesco">Bradesco</SelectItem>
                    <SelectItem value="itau">Itaú</SelectItem>
                    <SelectItem value="santander">Santander</SelectItem>
                    <SelectItem value="nubank">Nubank</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Tipo de Conta</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    placeholder="0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Número da Conta</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="00000-0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Titular da Conta</Label>
                <Input
                  id="accountHolder"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="Nome completo do titular"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#3e2626] hover:bg-[#5a3a3a]">
                  Adicionar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Você ainda não tem contas bancárias cadastradas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <Building2 className="h-8 w-8 text-[#3e2626]" />
                <div>
                  <p className="font-medium text-gray-900">{account.bankName}</p>
                  <p className="text-sm text-gray-500">
                    {account.accountType === "corrente" ? "Conta Corrente" : "Conta Poupança"} - 
                    Ag: {account.agency} - Conta: {account.accountNumber}
                  </p>
                  <p className="text-sm text-gray-500">Titular: {account.accountHolder}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

