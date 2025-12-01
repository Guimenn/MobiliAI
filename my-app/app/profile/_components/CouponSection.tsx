"use client";

import { useMemo, useState, useEffect } from "react";
import { Clipboard, Check, Ticket, Calendar, Percent, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { customerAPI } from "@/lib/api";
import { useAppStore } from "@/lib/store";

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

interface BackendCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  userUsageCount?: number; // Quantas vezes o usuário específico usou
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableTo: string;
  categoryId?: string;
  productId?: string;
  storeId?: string;
  assignmentType?: string;
  couponType?: string;
  createdAt: string;
}

interface MappedCoupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumPurchase?: number;
  expiresAt: string;
  status: CouponStatus;
  usageLimit?: number;
  usedCount?: number;
  category?: string;
}

export default function CouponSection() {
  const { user } = useAppStore();
  const [filter, setFilter] = useState<FilterOption>("ativos");
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<MappedCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const backendCoupons: BackendCoupon[] = await customerAPI.getCoupons();
        
        // Mapear cupons do backend para o formato esperado
        const mappedCoupons: MappedCoupon[] = backendCoupons.map((coupon) => {
          const now = new Date();
          const validUntil = new Date(coupon.validUntil);
          const isExpired = validUntil < now;
          
          // Determinar status: se expirou, é expired; caso contrário, verificar se foi usado pelo usuário
          let status: CouponStatus = "active";
          if (isExpired) {
            status = "expired";
          } else if (coupon.userUsageCount !== undefined && coupon.userUsageCount > 0) {
            // Se o usuário já usou o cupom pelo menos uma vez, marcar como usado
            status = "used";
          }

          return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description || "",
            discountType: coupon.discountType === "PERCENTAGE" ? "percentage" : "fixed",
            discountValue: coupon.discountValue,
            minimumPurchase: coupon.minimumPurchase,
            expiresAt: coupon.validUntil,
            status,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            category: coupon.categoryId || undefined,
          };
        });

        setCoupons(mappedCoupons);
      } catch (error) {
        console.error("Erro ao buscar cupons:", error);
        toast.error("Não foi possível carregar os cupons.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCoupons();
    }
  }, [user]);

  const filteredCoupons = useMemo(() => {
    switch (filter) {
      case "ativos":
        return coupons.filter((coupon) => {
          const isExpired = new Date(coupon.expiresAt) < new Date();
          return coupon.status === "active" && !isExpired;
        });
      case "utilizados":
        return coupons.filter((coupon) => coupon.status === "used");
      case "expirados":
        return coupons.filter((coupon) => {
          const isExpired = new Date(coupon.expiresAt) < new Date();
          return isExpired || coupon.status === "expired";
        });
      case "todos":
      default:
        return coupons;
    }
  }, [coupons, filter]);

  const summary = useMemo(() => {
    const now = new Date();
    const activeCount = coupons.filter((coupon) => {
      const isExpired = new Date(coupon.expiresAt) < now;
      return coupon.status === "active" && !isExpired;
    }).length;
    const usedCount = coupons.filter((coupon) => coupon.status === "used").length;
    const expiredCount = coupons.filter((coupon) => {
      const isExpired = new Date(coupon.expiresAt) < now;
      return isExpired || coupon.status === "expired";
    }).length;
    return { activeCount, usedCount, expiredCount };
  }, [coupons]);

  const handleCopyCode = async (coupon: MappedCoupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedCouponId(coupon.id);
      toast.success(`Cupom ${coupon.code} copiado!`);
      setTimeout(() => setCopiedCouponId((prev) => (prev === coupon.id ? null : prev)), 2000);
    } catch (error) {
      toast.error("Não foi possível copiar o cupom.");
    }
  };

  const handleMarkAsUsed = (coupon: MappedCoupon) => {
    if (coupon.status !== "active") {
      toast.error("Somente cupons ativos podem ser usados.");
      return;
    }

    // Redirecionar para a página de produtos para usar o cupom
    window.location.href = `/products?coupon=${coupon.code}`;
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando cupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
            <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Nenhum cupom por aqui</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Assim que surgirem promoções ou recompensas, você verá tudo nesta área.
            </p>
          </div>
        ) : (
          filteredCoupons.map((coupon) => {
            const now = new Date();
            const expiresAt = new Date(coupon.expiresAt);
            const isExpired = expiresAt < now;
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
                          Limite de uso: {coupon.usageLimit}x por cliente
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

