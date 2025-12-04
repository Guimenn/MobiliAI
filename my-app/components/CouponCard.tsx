"use client";

import { Calendar, ShoppingCart, Gift, Truck, Check, Clipboard, ArrowRight, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CouponCardProps {
  coupon: {
    id: string;
    code: string;
    description?: string | null;
    discountType: "percentage" | "fixed" | "PERCENTAGE" | "FIXED";
    discountValue: number;
    minimumPurchase?: number;
    maximumDiscount?: number;
    expiresAt?: string;
    validUntil?: string;
    usageLimit?: number;
    status?: "active" | "used" | "expired";
    couponType?: string;
  };
  onCopy?: (code: string) => void;
  onUse?: (code: string) => void;
  copiedCode?: string | null;
  showCopyButton?: boolean;
  showUseButton?: boolean;
  formatCurrency?: (value: number) => string;
  formatDate?: (date: string) => string;
  statusLabels?: Record<string, string>;
  unavailableReason?: string;
}

function defaultFormatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function defaultFormatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const defaultStatusLabels: Record<string, string> = {
  active: "Disponível",
  used: "Usado",
  expired: "Expirado",
  unavailable: "Indisponível",
};

export default function CouponCard({
  coupon,
  onCopy,
  onUse,
  copiedCode = null,
  showCopyButton = true,
  showUseButton = true,
  formatCurrency = defaultFormatCurrency,
  formatDate = defaultFormatDate,
  statusLabels = defaultStatusLabels,
  unavailableReason,
}: CouponCardProps) {
  const discountType = coupon.discountType === "PERCENTAGE" || coupon.discountType === "percentage" ? "percentage" : "fixed";
  const expiresAt = coupon.expiresAt || coupon.validUntil || "";
  const now = new Date();
  const isExpired = expiresAt ? new Date(expiresAt) < now : false;
  const effectiveStatus = unavailableReason ? "unavailable" : (isExpired ? "expired" : coupon.status || "active");
  const isActive = effectiveStatus === "active" && !isExpired;
  const isUnavailable = effectiveStatus === "unavailable";
  const isFreteCoupon = coupon.couponType === "SHIPPING" ||
                        coupon.description?.toLowerCase().includes("frete") ||
                        coupon.description?.toLowerCase().includes("envio") ||
                        coupon.description?.toLowerCase().includes("entrega") ||
                        coupon.code?.toLowerCase().includes("frete");

  const isCopied = copiedCode === coupon.code;

  return (
    <div className="relative my-6 mx-4">
      {/* Coupon Card com recortes laterais */}
      <div className="relative">
        {/* Wrapper com borda marrom */}
        <div className={`relative border-[3px] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-visible ${
          isUnavailable 
            ? 'border-[#3e2626]/20 opacity-75' 
            : 'border-[#3e2626]'
        }`}>
          {/* Recortes semicirculares nas laterais - apenas buracos simples mostrando o fundo */}
          <div 
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full z-30 border-r-[3px] ${
              isUnavailable ? 'border-[#3e2626]/20' : 'border-[#3e2626]'
            }`}
          ></div>
          <div 
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-white rounded-full z-30 border-l-[3px] ${
              isUnavailable ? 'border-[#3e2626]/20' : 'border-[#3e2626]'
            }`}
          ></div>
          
          {/* Card branco interno */}
          <div className="relative bg-white rounded-xl overflow-hidden">
            <div className="flex min-h-[200px] relative">
            {/* Seção esquerda - Informações do cupom */}
            <div className="flex-1 p-6 relative">
              {/* Linha de perfuração vertical */}
              <div 
                className="absolute right-0 top-0 bottom-0"
                style={{
                  borderRight: `2px dashed ${isUnavailable ? '#9ca3af' : '#3e2626'}`,
                  backgroundImage: isUnavailable 
                    ? 'repeating-linear-gradient(to bottom, transparent, transparent 8px, rgba(156, 163, 175, 0.1) 8px, rgba(156, 163, 175, 0.1) 10px)'
                    : 'repeating-linear-gradient(to bottom, transparent, transparent 8px, rgba(62, 38, 38, 0.1) 8px, rgba(62, 38, 38, 0.1) 10px)'
                }}
              ></div>
            
            <div className="h-full flex flex-col justify-between pr-8">
              <div>
                {/* Tag do código */}
                <div className="inline-block mb-4">
                  <span className={`text-xs font-bold px-4 py-2 rounded-lg uppercase ${
                    isUnavailable
                      ? 'bg-[#3e2626]/40 text-gray-700 shadow-md'
                      : isActive
                      ? 'bg-[#3e2626] text-white shadow-md' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {coupon.code}
                  </span>
                </div>

                {/* Desconto grande com símbolo de porcentagem ou valor fixo */}
                <div className="mb-4">
                  {discountType === "percentage" ? (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-7xl font-black leading-none ${
                        isUnavailable 
                          ? 'text-gray-500 line-through' 
                          : !isActive 
                          ? 'text-[#3e2626] opacity-30' 
                          : 'text-[#3e2626]'
                      }`}>
                        {coupon.discountValue}
                      </span>
                      <span className={`text-6xl font-black leading-none ${
                        isUnavailable 
                          ? 'text-gray-500 line-through' 
                          : !isActive 
                          ? 'text-[#3e2626] opacity-30' 
                          : 'text-[#3e2626]'
                      }`}>
                        %
                      </span>
                      <span className={`text-3xl font-extrabold tracking-wide ml-3 ${
                        isUnavailable 
                          ? 'text-gray-500 line-through' 
                          : !isActive 
                          ? 'text-[#3e2626] opacity-30' 
                          : 'text-[#3e2626]'
                      }`}>
                        OFF
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold ${
                        isUnavailable 
                          ? 'text-gray-500 line-through' 
                          : !isActive 
                          ? 'text-[#3e2626] opacity-30' 
                          : 'text-[#3e2626]'
                      }`}>
                        {formatCurrency(coupon.discountValue)}
                      </span>
                      <span className={`text-3xl font-extrabold tracking-wide ml-3 ${
                        isUnavailable 
                          ? 'text-gray-500 line-through' 
                          : !isActive 
                          ? 'text-[#3e2626] opacity-30' 
                          : 'text-[#3e2626]'
                      }`}>
                        OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* Tipo de desconto ou indisponível */}
                {isUnavailable && (
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                    Cupom Indisponível
                  </p>
                )}

                {/* Descrição */}
                {coupon.description && (
                  <div className={`rounded-md p-3 border mb-4 ${
                    isUnavailable
                      ? 'bg-white/50 backdrop-blur-sm border-[#3e2626]/10'
                      : ''
                  }`}>
                    <p className={`text-sm font-medium ${
                      isUnavailable
                        ? 'text-gray-600'
                        : `text-gray-800 ${!isActive ? 'opacity-50' : ''}`
                    }`}>
                      {coupon.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Informações adicionais */}
              <div className="space-y-2 text-xs text-gray-600">
                {coupon.minimumPurchase && (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className={`h-3.5 w-3.5 flex-shrink-0 ${
                      isUnavailable ? 'text-gray-400' : 'text-[#3e2626]'
                    }`} />
                    <span>Compra mínima: {formatCurrency(coupon.minimumPurchase)}</span>
                  </div>
                )}
                {discountType === "percentage" && coupon.maximumDiscount && (
                  <div className="flex items-center gap-2">
                    <Gift className={`h-3.5 w-3.5 flex-shrink-0 ${
                      isUnavailable ? 'text-gray-400' : 'text-[#3e2626]'
                    }`} />
                    <span>Desconto máximo: {formatCurrency(coupon.maximumDiscount)}</span>
                  </div>
                )}
                {expiresAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${
                      isUnavailable ? 'text-gray-400' : 'text-[#3e2626]'
                    }`} />
                    <span>Válido até: {formatDate(expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção direita - Botões de ação */}
          <div className={`w-[220px] p-6 flex flex-col justify-between ${
            isUnavailable 
              ? 'bg-gradient-to-br from-gray-100 to-gray-50' 
              : 'bg-gradient-to-br from-gray-50 to-white'
          }`}>
            <div>
              {isFreteCoupon && !isUnavailable && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
                  <Truck className="h-5 w-5 text-[#3e2626] flex-shrink-0" />
                  <span className="font-semibold">Frete Grátis</span>
                </div>
              )}
              
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-block mb-4 ${
                isUnavailable
                  ? 'bg-gray-100 text-gray-500 border border-gray-300'
                  : effectiveStatus === 'active' 
                  ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' 
                  : effectiveStatus === 'used'
                  ? 'bg-gray-100 text-[#3e2626] border border-gray-300'
                  : 'bg-gray-100 text-gray-500 border border-gray-300'
              }`}>
                {isUnavailable ? 'Indisponível' : (statusLabels[effectiveStatus] || statusLabels.active)}
              </div>

              {/* Motivo da indisponibilidade - na parte direita */}
              {isUnavailable && unavailableReason && (
                <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {unavailableReason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {isUnavailable ? (
                <Button
                  type="button"
                  disabled
                  className="w-full bg-[#3e2626]/30 text-[#3e2626]/60 cursor-not-allowed font-bold h-10 shadow-sm"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Indisponível
                </Button>
              ) : (
                <>
                  {showCopyButton && onCopy && (
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-center border-2 h-10 ${
                        isActive
                          ? 'border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626]/10'
                          : 'border-gray-300 text-gray-500 cursor-not-allowed'
                      } transition-colors`}
                      onClick={() => onCopy(coupon.code)}
                      disabled={!isActive}
                    >
                      {isCopied ? (
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
                  )}
                  {showUseButton && onUse && (
                    <Button
                      type="button"
                      onClick={() => onUse(coupon.code)}
                      className="w-full bg-[#3e2626] hover:bg-[#5a3a3a] text-white shadow-lg h-10 font-semibold"
                      disabled={!isActive}
                    >
                      {isActive ? (
                        <>
                          Usar agora
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : isFreteCoupon ? (
                        <>
                          <Truck className="h-4 w-4 mr-2" />
                          Usar
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Usar
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

