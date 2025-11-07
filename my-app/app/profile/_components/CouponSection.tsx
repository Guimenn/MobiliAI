"use client";

import { useMemo, useState } from "react";
import { Clipboard, Check, Ticket, Calendar, Percent, ShoppingCart, ArrowRight } from "lucide-react";
import { useAppStore, Coupon, CouponStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FilterOption = "ativos" | "utilizados" | "expirados" | "todos";

const filterLabels: Record<FilterOption, string> = {
  ativos: "Disponíveis",
  utilizados: "Usados",
  expirados: "Expirados",
  todos: "Todos",
};

const statusLabels: Record<CouponStatus, string> = {
  active: "Disponível",
  used: "Usado",
  expired: "Expirado",
};

const statusStyles: Record<CouponStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  used: "bg-blue-100 text-blue-700 border border-blue-200",
  expired: "bg-rose-100 text-rose-600 border border-rose-200",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CouponSection() {
  const { coupons, updateCouponStatus } = useAppStore();
  const [filter, setFilter] = useState<FilterOption>("ativos");
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  const filteredCoupons = useMemo(() => {
    switch (filter) {
      case "ativos":
        return coupons.filter((coupon) => coupon.status === "active");
      case "utilizados":
        return coupons.filter((coupon) => coupon.status === "used");
      case "expirados":
        return coupons.filter((coupon) => coupon.status === "expired");
      case "todos":
      default:
        return coupons;
    }
  }, [coupons, filter]);

  const summary = useMemo(() => {
    const activeCount = coupons.filter((coupon) => coupon.status === "active").length;
    const usedCount = coupons.filter((coupon) => coupon.status === "used").length;
    const expiredCount = coupons.filter((coupon) => coupon.status === "expired").length;
    return { activeCount, usedCount, expiredCount };
  }, [coupons]);

  const handleCopyCode = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedCouponId(coupon.id);
      toast.success(`Cupom ${coupon.code} copiado!`);
      setTimeout(() => setCopiedCouponId((prev) => (prev === coupon.id ? null : prev)), 2000);
    } catch (error) {
      toast.error("Não foi possível copiar o cupom.");
    }
  };

  const handleMarkAsUsed = (coupon: Coupon) => {
    if (coupon.status !== "active") {
      toast.error("Somente cupons ativos podem ser marcados como usados.");
      return;
    }

    updateCouponStatus(coupon.id, "used");
    toast.success(`Cupom ${coupon.code} marcado como usado!`);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#3e2626]" />
            Meus cupons
          </h1>
          <p className="text-sm text-gray-500">
            Veja ofertas exclusivas e acompanhe o status dos seus cupons.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Disponíveis</p>
            <p className="text-xl font-semibold text-emerald-600">{summary.activeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usados</p>
            <p className="text-xl font-semibold text-blue-600">{summary.usedCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expirados</p>
            <p className="text-xl font-semibold text-rose-500">{summary.expiredCount}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                filter === option
                  ? "border-[#3e2626] bg-[#3e2626] text-white"
                  : "border-gray-200 text-gray-600 hover:border-[#3e2626]/30 hover:text-[#3e2626]"
              }`}
            >
              {filterLabels[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
            <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Nenhum cupom por aqui</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Assim que surgirem promoções ou recompensas, você verá tudo nesta área.
            </p>
          </div>
        ) : (
          filteredCoupons.map((coupon) => {
            const isExpired = coupon.status === "expired" || new Date(coupon.expiresAt) < new Date();
            const showMarkUsed = coupon.status === "active" && !isExpired;
            const effectiveStatus = isExpired ? "expired" : coupon.status;

            return (
              <div
                key={coupon.id}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[effectiveStatus]}`}>
                      {statusLabels[effectiveStatus]}
                    </span>
                    {coupon.category && (
                      <span className="text-xs font-medium text-[#3e2626] bg-[#3e2626]/10 px-2 py-1 rounded-full">
                        {coupon.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {isExpired ? "Expirado" : `Expira em ${formatDate(coupon.expiresAt)}`}
                  </div>
                </div>

                <div className="px-5 py-4 grid gap-4 md:grid-cols-[2fr,1fr]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#3e2626]/10 text-[#3e2626] flex items-center justify-center">
                        {coupon.discountType === "percentage" ? (
                          <Percent className="h-6 w-6" />
                        ) : (
                          <ShoppingCart className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{coupon.code}</p>
                        <p className="text-sm text-gray-600">{coupon.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% off`
                          : `Desconto de ${formatCurrency(coupon.discountValue)}`
                        }
                      </span>
                      {coupon.minimumPurchase && (
                        <span>Pedido mínimo: {formatCurrency(coupon.minimumPurchase)}</span>
                      )}
                      {coupon.usageLimit && (
                        <span>
                          Uso restante: {Math.max((coupon.usageLimit ?? 0) - (coupon.usedCount ?? 0), 0)}x
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-center border-dashed border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white transition-colors"
                      onClick={() => handleCopyCode(coupon)}
                    >
                      {copiedCouponId === coupon.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-4 w-4 mr-2" />
                          Copiar código
                        </>
                      )}
                    </Button>
                    {showMarkUsed && (
                      <Button
                        type="button"
                        onClick={() => handleMarkAsUsed(coupon)}
                        className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
                      >
                        Usar agora
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

