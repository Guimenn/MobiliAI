"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
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

interface VirtualDebitCard {
  id: string;
  number: string;
  holderName: string;
}

export function VirtualDebitCardSection() {
  const [cards, setCards] = useState<VirtualDebitCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    holderName: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica de salvamento
    const newCard: VirtualDebitCard = {
      id: Date.now().toString(),
      ...formData,
    };
    setCards([...cards, newCard]);
    setIsDialogOpen(false);
    setFormData({
      number: "",
      holderName: "",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Cartão Débito Virtual CAIXA Elo
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão Débito Virtual CAIXA Elo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Cartão Débito Virtual CAIXA Elo</DialogTitle>
              <DialogDescription>
                Preencha os dados do seu cartão débito virtual
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="virtualCardNumber">Número do Cartão</Label>
                <Input
                  id="virtualCardNumber"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="virtualHolderName">Nome no Cartão</Label>
                <Input
                  id="virtualHolderName"
                  value={formData.holderName}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  placeholder="NOME COMPLETO"
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

      {cards.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Você ainda não tem cartões cadastrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <CreditCard className="h-8 w-8 text-[#3e2626]" />
                <div>
                  <p className="font-medium text-gray-900">
                    CAIXA Elo •••• {card.number.slice(-4)}
                  </p>
                  <p className="text-sm text-gray-500">{card.holderName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

