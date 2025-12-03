"use client";

import { useMemo, useState, useEffect } from "react";
import { Ticket, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { customerAPI } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import CouponCard from "@/components/CouponCard";

type FilterOption = "ativos" | "frete" | "expirados" | "todos";

type CouponStatus = "active" | "used" | "expired";

const filterLabels: Record<FilterOption, string> = {
  ativos: "Disponíveis",
  frete: "Frete",
  expirados: "Expirados",
  todos: "Todos",
};

const statusLabels: Record<CouponStatus, string> = {
  active: "Disponível",
  used: "Usado",
  expired: "Expirado",
};

const statusStyles: Record<CouponStatus, string> = {
  active: "bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20",
  used: "bg-gray-100 text-gray-700 border border-gray-200",
  expired: "bg-gray-100 text-gray-500 border border-gray-200",
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
  userUsageCount?: number; // Quantas vezes o usuário específico usou em vendas (apenas com saleId não nulo)
  isRedeemed?: boolean; // Indica se o cupom foi resgatado mas ainda não usado
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
  maximumDiscount?: number;
  expiresAt: string;
  status: CouponStatus;
  usageLimit?: number;
  usedCount?: number;
  category?: string;
  couponType?: string;
}

export default function CouponSection() {
  const { user } = useAppStore();
  const [filter, setFilter] = useState<FilterOption>("ativos");
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<MappedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

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
          
          // Determinar status: se expirou, é expired; caso contrário, verificar se foi usado pelo usuário em vendas
          let status: CouponStatus = "active";
          if (isExpired) {
            status = "expired";
          } else if (coupon.userUsageCount !== undefined && coupon.userUsageCount > 0) {
            // Se o usuário já usou o cupom em vendas pelo menos uma vez, marcar como usado
            // userUsageCount conta apenas usos em vendas (saleId não nulo), não resgates
            status = "used";
          }
          // Se foi resgatado mas não usado (isRedeemed = true e userUsageCount = 0), mantém como "active"

          return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description || "",
            discountType: coupon.discountType === "PERCENTAGE" ? "percentage" : "fixed",
            discountValue: coupon.discountValue,
            minimumPurchase: coupon.minimumPurchase,
            maximumDiscount: coupon.maximumDiscount,
            expiresAt: coupon.validUntil,
            status,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            category: coupon.categoryId || undefined,
            couponType: coupon.couponType || undefined,
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
      case "frete":
        return coupons.filter((coupon) => {
          // Verificar pelo tipo do cupom primeiro
          if (coupon.couponType === "SHIPPING") {
            return true;
          }
          // Fallback: verificar por palavras-chave na descrição ou código
          const description = coupon.description?.toLowerCase() || "";
          const code = coupon.code?.toLowerCase() || "";
          return description.includes("frete") || 
                 description.includes("envio") || 
                 description.includes("entrega") ||
                 code.includes("frete") ||
                 code.includes("envio") ||
                 code.includes("entrega");
        });
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
    const freteCount = coupons.filter((coupon) => {
      // Verificar pelo tipo do cupom primeiro
      if (coupon.couponType === "SHIPPING") {
        return true;
      }
      // Fallback: verificar por palavras-chave na descrição ou código
      const description = coupon.description?.toLowerCase() || "";
      const code = coupon.code?.toLowerCase() || "";
      return description.includes("frete") || 
             description.includes("envio") || 
             description.includes("entrega") ||
             code.includes("frete") ||
             code.includes("envio") ||
             code.includes("entrega");
    }).length;
    const expiredCount = coupons.filter((coupon) => {
      const isExpired = new Date(coupon.expiresAt) < now;
      return isExpired || coupon.status === "expired";
    }).length;
    return { activeCount, freteCount, expiredCount };
  }, [coupons]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      const coupon = coupons.find(c => c.code === code);
      if (coupon) {
        setCopiedCouponId(coupon.id);
        toast.success(`Cupom ${code} copiado!`);
        setTimeout(() => setCopiedCouponId((prev) => (prev === coupon.id ? null : prev)), 2000);
      }
    } catch (error) {
      toast.error("Não foi possível copiar o cupom.");
    }
  };

  const handleMarkAsUsed = (code: string) => {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon || coupon.status !== "active") {
      toast.error("Somente cupons ativos podem ser usados.");
      return;
    }

    // Redirecionar para a página de produtos para usar o cupom
    window.location.href = `/products?coupon=${code}`;
  };

  const handleRedeemCoupon = async () => {
    if (!redeemCode.trim()) {
      toast.error("Digite um código de cupom.");
      return;
    }

    const codeToRedeem = redeemCode.trim().toUpperCase();
    console.log('🎫 Frontend: Tentando resgatar cupom:', codeToRedeem);

    try {
      setRedeeming(true);
      
      console.log('🎫 Frontend: Chamando API para resgatar cupom...');
      const result = await customerAPI.redeemCoupon(codeToRedeem);
      console.log('✅ Frontend: Cupom resgatado com sucesso na API:', result);
      
      toast.success("Cupom resgatado com sucesso!");
      setShowRedeemModal(false);
      setRedeemCode("");
      
      // Recarregar os cupons
      console.log('🔄 Frontend: Recarregando lista de cupons...');
      const backendCoupons: BackendCoupon[] = await customerAPI.getCoupons();
      console.log('📋 Frontend: Cupons recebidos do backend:', backendCoupons.length, backendCoupons.map(c => ({
        code: c.code,
        assignmentType: c.assignmentType,
        id: c.id,
      })));
      
      const mappedCoupons: MappedCoupon[] = backendCoupons.map((coupon) => {
        const now = new Date();
        const validUntil = new Date(coupon.validUntil);
        const isExpired = validUntil < now;
        
        let status: CouponStatus = "active";
        if (isExpired) {
          status = "expired";
        } else if (coupon.userUsageCount !== undefined && coupon.userUsageCount > 0) {
          // Se o usuário já usou o cupom em vendas pelo menos uma vez, marcar como usado
          // userUsageCount conta apenas usos em vendas (saleId não nulo), não resgates
          status = "used";
        }
        // Se foi resgatado mas não usado (isRedeemed = true e userUsageCount = 0), mantém como "active"

        return {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description || "",
          discountType: coupon.discountType === "PERCENTAGE" ? "percentage" : "fixed",
          discountValue: coupon.discountValue,
          minimumPurchase: coupon.minimumPurchase,
          maximumDiscount: coupon.maximumDiscount,
          expiresAt: coupon.validUntil,
          status,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
          category: coupon.categoryId || undefined,
          couponType: coupon.couponType || undefined,
        };
      });

      console.log('📋 Frontend: Cupons mapeados:', mappedCoupons.length, mappedCoupons.map(c => ({
        code: c.code,
        status: c.status,
        id: c.id,
      })));

      setCoupons(mappedCoupons);
      
      // Verificar se o cupom resgatado está na lista
      const redeemedCouponInList = mappedCoupons.find(c => c.code === codeToRedeem);
      if (redeemedCouponInList) {
        console.log('✅ Frontend: Cupom resgatado está na lista!', redeemedCouponInList);
      } else {
        console.error('❌ Frontend: Cupom resgatado NÃO está na lista!', {
          code: codeToRedeem,
          totalCoupons: mappedCoupons.length,
          allCodes: mappedCoupons.map(c => c.code),
        });
        toast.warning("Cupom resgatado, mas não apareceu na lista. Tente recarregar a página.");
      }
    } catch (error: any) {
      console.error("❌ Frontend: Erro ao resgatar cupom:", error);
      console.error("❌ Frontend: Detalhes do erro:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || error.message || "Não foi possível resgatar o cupom. Verifique se o código está correto.");
    } finally {
      setRedeeming(false);
    }
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
            <p className="text-xl font-semibold text-[#3e2626]">{summary.activeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frete</p>
            <p className="text-xl font-semibold text-[#3e2626]">{summary.freteCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expirados</p>
            <p className="text-xl font-semibold text-gray-500">{summary.expiredCount}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
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
        <Button
          type="button"
          onClick={() => setShowRedeemModal(true)}
          className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar cupom
        </Button>
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
            const isFreteCoupon = coupon.couponType === "SHIPPING" ||
                                  coupon.description?.toLowerCase().includes("frete") || 
                                  coupon.description?.toLowerCase().includes("envio") ||
                                  coupon.description?.toLowerCase().includes("entrega") ||
                                  coupon.code?.toLowerCase().includes("frete");

            return (
              <CouponCard
                key={coupon.id}
                coupon={{
                  ...coupon,
                  discountType: coupon.discountType === "percentage" ? "percentage" : "fixed",
                }}
                onCopy={handleCopyCode}
                onUse={handleMarkAsUsed}
                copiedCode={copiedCouponId === coupon.id ? coupon.code : null}
                showCopyButton={true}
                showUseButton={showMarkUsed}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                statusLabels={statusLabels}
              />
            );
          })
        )}
      </div>

      {/* Modal para resgatar cupom */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[#3e2626]" />
                Resgatar cupom exclusivo
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowRedeemModal(false);
                  setRedeemCode("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Digite o código do cupom exclusivo que você recebeu para adicioná-lo à sua conta.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código do cupom
                </label>
                <Input
                  id="coupon-code"
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="Ex: CUPOM123"
                  className="w-full uppercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRedeemCoupon();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setRedeemCode("");
                  }}
                  className="flex-1"
                  disabled={redeeming}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleRedeemCoupon}
                  className="flex-1 bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
                  disabled={redeeming || !redeemCode.trim()}
                >
                  {redeeming ? "Resgatando..." : "Resgatar cupom"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

