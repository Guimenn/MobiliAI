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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreditCard {
  id: string;
  number: string;
  holderName: string;
  expiryDate: string;
  cvv: string;
  brand: string;
}

export function CreditCardSection() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    holderName: "",
    expiryDate: "",
    cvv: "",
    brand: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica de salvamento
    const newCard: CreditCard = {
      id: Date.now().toString(),
      ...formData,
    };
    setCards([...cards, newCard]);
    setIsDialogOpen(false);
    setFormData({
      number: "",
      holderName: "",
      expiryDate: "",
      cvv: "",
      brand: "",
    });
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ").slice(0, 19);
  };

  return (
    <div className=" bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cartão De Crédito</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão De Crédito
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Cartão De Crédito</DialogTitle>
              <DialogDescription>
                Preencha os dados do seu cartão de crédito
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão</Label>
                <Input
                  id="cardNumber"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: formatCardNumber(e.target.value) })
                  }
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holderName">Nome no Cartão</Label>
                <Input
                  id="holderName"
                  value={formData.holderName}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  placeholder="NOME COMPLETO"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Validade</Label>
                  <Input
                    id="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                    placeholder="000"
                    maxLength={3}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Bandeira</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a bandeira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                  </SelectContent>
                </Select>
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
                    {card.brand.toUpperCase()} •••• {card.number.slice(-4)}
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

