'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { salesAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Box,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  Info,
  MapPin,
  Package,
  Phone,
  Receipt,
  Shield,
  ShoppingBag,
  Store,
  Truck,
  User,
  Wallet,
} from 'lucide-react';

interface SaleDetailsPanelProps {
  saleId: string | null;
  onClose?: () => void;
}

interface SaleDetails {
  id: string;
  saleNumber: string;
  totalAmount: number;
  discount: number;
  tax: number;
  status: string;
  deliveryStatus?: string;
  paymentMethod: string;
  paymentStatus?: string;
  paymentGateway?: string;
  transactionId?: string;
  paymentReference?: string;
  installments?: number;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt?: string;
  netAmount?: number;
  shippingCost?: number;
  additionalFees?: number;
  itemsTotal?: number;
  totalWeight?: number;
  totalVolume?: number;
  channel?: string;
  source?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  invoiceIssuedAt?: string;
  invoiceDueDate?: string;
  coupons?: Array<{
    code: string;
    type?: 'percentage' | 'amount';
    value?: number;
  }>;
  customer?: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
    loyaltyLevel?: string;
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  employee?: {
    name: string;
    email: string;
    role?: string;
  };
  store?: {
    name: string;
    address?: string;
    phone?: string;
  };
  shipping?: {
    recipientName?: string;
    phone?: string;
    method?: string;
    trackingCode?: string;
    estimatedDelivery?: string;
    carrier?: string;
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      complement?: string;
    };
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    profit?: number;
    costPrice?: number;
    notes?: string;
    product: {
      name: string;
      sku?: string;
      category?: string;
    };
  }>;
  timeline?: Array<{
    id: string;
    label: string;
    description?: string;
    createdAt: string;
    status?: string;
  }>;
}

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  PIX: 'PIX',
  credit_card: 'Cartão de Crédito',
  credit: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  debit: 'Cartão de Débito',
  cash: 'Dinheiro',
  boleto: 'Boleto Bancário',
};

const paymentIcons: Record<string, JSX.Element> = {
  pix: <Wallet className="h-4 w-4" />,
  credit_card: <CreditCard className="h-4 w-4" />,
  debit_card: <CreditCard className="h-4 w-4" />,
  cash: <DollarSign className="h-4 w-4" />,
  boleto: <Receipt className="h-4 w-4" />,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Concluída', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Reembolsada', className: 'bg-gray-100 text-gray-800' },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Pagamento aprovado', className: 'bg-green-100 text-green-800' },
  DECLINED: { label: 'Pagamento recusado', className: 'bg-red-100 text-red-800' },
  PROCESSING: { label: 'Processando pagamento', className: 'bg-yellow-100 text-yellow-800' },
  PENDING: { label: 'Pagamento pendente', className: 'bg-yellow-100 text-yellow-800' },
};

const deliveryStatusConfig: Record<string, { label: string; className: string }> = {
  IN_TRANSIT: { label: 'Em trânsito', className: 'bg-blue-100 text-blue-800' },
  DELIVERED: { label: 'Entregue', className: 'bg-green-100 text-green-800' },
  PENDING: { label: 'Aguardando envio', className: 'bg-yellow-100 text-yellow-800' },
  RETURNED: { label: 'Devolvida', className: 'bg-red-100 text-red-800' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

const formatDateTime = (date?: string) =>
  date
    ? new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

export default function SaleDetailsPanel({ saleId, onClose }: SaleDetailsPanelProps) {
  const { user } = useAppStore();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canViewProfit = user?.role === 'ADMIN' || user?.role === 'admin';

  useEffect(() => {
    if (saleId) {
      loadSaleDetails();
    }
  }, [saleId]);

  const loadSaleDetails = async () => {
    if (!saleId) return;
    try {
      setIsLoading(true);
      const saleData = await salesAPI.getById(saleId);
      setSale(saleData);
    } catch (error) {
      console.error('Erro ao carregar detalhes da venda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    if (!sale) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        additionalFees: 0,
        netAmount: 0,
        gross: 0,
        profit: 0,
      };
    }

    const subtotal = (sale.totalAmount || 0) + (sale.discount || 0) - (sale.tax || 0);
    // Calcular lucro: usar profit se disponível, senão calcular a partir de costPrice
    const profit = sale.items?.reduce((sum: number, item: any) => {
      // Se já tem profit calculado, usar ele
      if (item.profit !== undefined && item.profit !== null) {
        return sum + Number(item.profit);
      }
      // Se não tem profit mas tem costPrice, calcular
      if (item.costPrice !== undefined && item.costPrice !== null && item.unitPrice && item.quantity) {
        const unitPrice = Number(item.unitPrice);
        const costPrice = Number(item.costPrice);
        const quantity = Number(item.quantity);
        if (!isNaN(unitPrice) && !isNaN(costPrice) && !isNaN(quantity)) {
          return sum + ((unitPrice - costPrice) * quantity);
        }
      }
      return sum;
    }, 0) || 0;
    
    return {
      subtotal,
      discount: sale.discount || 0,
      tax: sale.tax || 0,
      shipping: sale.shippingCost || 0,
      additionalFees: sale.additionalFees || 0,
      netAmount: sale.netAmount || sale.totalAmount || 0,
      gross: sale.totalAmount || 0,
      profit,
    };
  }, [sale]);

  if (!saleId) return null;

  const paymentMethodKey = sale?.paymentMethod?.toLowerCase() as keyof typeof paymentLabels | undefined;
  const paymentLabel =
    (paymentMethodKey && paymentLabels[paymentMethodKey]) || sale?.paymentMethod || 'Método não informado';
  const paymentIcon =
    (paymentMethodKey && paymentIcons[paymentMethodKey]) || <CreditCard className="h-4 w-4" />;

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900">Detalhes da Venda</p>
            <div className="text-sm text-gray-500 space-y-0.5">
              <p>
                Venda #{sale?.saleNumber || sale?.id} • Criada em {formatDateTime(sale?.createdAt)}
              </p>
              {sale?.updatedAt && <p>Atualizada em {formatDateTime(sale.updatedAt)}</p>}
            </div>
          </div>
        </div>
        {sale?.status && (
          <Badge className={statusConfig[sale.status]?.className || statusConfig.PENDING.className}>
            {statusConfig[sale.status]?.label || sale.status}
          </Badge>
        )}
      </div>

      <div className="rounded-2xl bg-gray-50 px-6 py-6 mt-4">
        {isLoading || !sale ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500">Carregando detalhes da venda...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <SummaryCard label="Total da Venda" value={formatCurrency(totals.gross)} icon={<DollarSign className="h-4 w-4" />} />
              <SummaryCard label="Itens" value={String(sale.items?.length || 0)} icon={<ShoppingBag className="h-4 w-4" />} />
              <SummaryCard
                label="Transação"
                value={sale.transactionId || sale.paymentReference || '-'}
                helper={sale.paymentGateway || 'Gateway não informado'}
                icon={<Shield className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoCard
                title="Cliente"
                icon={<User className="h-4 w-4" />}
                items={[
                  { label: 'Nome', value: sale.customer?.name || '—' },
                  { label: 'Email', value: sale.customer?.email || '—' },
                  { label: 'Telefone', value: sale.customer?.phone },
                  { label: 'Documento', value: sale.customer?.document },
                  { label: 'Nível de Fidelidade', value: sale.customer?.loyaltyLevel },
                ]}
                footer={sale.customer?.address && (
                  <AddressBlock
                    title="Endereço do cliente"
                    address={[sale.customer.address.street, sale.customer.address.number, sale.customer.address.neighborhood]
                      .filter(Boolean)
                      .join(', ')}
                    cityLine={[sale.customer.address.city, sale.customer.address.state, sale.customer.address.zipCode]
                      .filter(Boolean)
                      .join(' - ')}
                  />
                )}
              />

              <InfoCard
                title="Loja"
                icon={<Store className="h-4 w-4" />}
                items={[
                  { label: 'Nome', value: sale.store?.name || '—' },
                  { label: 'Endereço', value: sale.store?.address || '—' },
                  { label: 'Telefone', value: sale.store?.phone },
                ]}
              />

              <InfoCard
                title="Funcionário"
                icon={<User className="h-4 w-4" />}
                items={[
                  { label: 'Nome', value: sale.employee?.name || '—' },
                  { label: 'Email', value: sale.employee?.email || '—' },
                  { label: 'Cargo', value: sale.employee?.role },
                ]}
              />

              <InfoCard
                title="Pagamento"
                icon={<CreditCard className="h-4 w-4" />}
                items={[
                  { label: 'Método', value: (
                      <span className="flex items-center gap-2 text-gray-900">
                        {paymentIcon}
                        {paymentLabel}
                      </span>
                    ) },
                  sale.installments && sale.installments > 1
                    ? { label: 'Parcelas', value: `${sale.installments}x de ${formatCurrency((sale.totalAmount || 0) / sale.installments)}` }
                    : undefined,
                  sale.paymentReference ? { label: 'Referência', value: sale.paymentReference } : undefined,
                  sale.paymentGateway ? { label: 'Gateway', value: sale.paymentGateway } : undefined,
                  sale.transactionId ? { label: 'Transação', value: sale.transactionId } : undefined,
                ].filter(Boolean) as { label: string; value?: ReactNode }[]}
                footer={
                  <Badge className={paymentStatusConfig[sale.paymentStatus || 'APPROVED']?.className || 'bg-green-100 text-green-800'}>
                    {paymentStatusConfig[sale.paymentStatus || 'APPROVED']?.label || sale.paymentStatus || 'Pagamento confirmado'}
                  </Badge>
                }
              />
            </div>

            {sale.shipping && (
              <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
                <SectionTitle icon={<Truck className="h-4 w-4" />} title="Envio e Entrega" />
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoList
                    items={[
                      { label: 'Destinatário', value: sale.shipping.recipientName || sale.customer?.name || '—' },
                      { label: 'Telefone', value: sale.shipping.phone },
                      { label: 'Transportadora', value: sale.shipping.carrier },
                      { label: 'Tracking', value: sale.shipping.trackingCode },
                      { label: 'Previsão', value: formatDateTime(sale.shipping.estimatedDelivery) },
                      sale.shippingCost !== undefined
                        ? { label: 'Custo de frete', value: formatCurrency(sale.shippingCost) }
                        : undefined,
                    ].filter(Boolean) as { label: string; value?: ReactNode }[]}
                  />
                  <InfoList
                    items={[
                      { label: 'Método', value: sale.shipping.method || '—' },
                      { label: 'Status de entrega', value: sale.deliveryStatus ? (
                        <Badge className={deliveryStatusConfig[sale.deliveryStatus]?.className || 'bg-blue-100 text-blue-800'}>
                          {deliveryStatusConfig[sale.deliveryStatus]?.label || sale.deliveryStatus}
                        </Badge>
                      ) : undefined },
                      sale.totalWeight !== undefined
                        ? { label: 'Peso total', value: `${sale.totalWeight} kg` }
                        : undefined,
                      sale.totalVolume !== undefined
                        ? { label: 'Volume', value: `${sale.totalVolume} m³` }
                        : undefined,
                    ].filter(Boolean) as { label: string; value?: ReactNode }[]}
                  />
                </div>
                {sale.shipping.address && (
                  <AddressBlock
                    title="Endereço de entrega"
                    address={[
                      sale.shipping.address.street,
                      sale.shipping.address.number,
                      sale.shipping.address.neighborhood,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    cityLine={[
                      sale.shipping.address.city,
                      sale.shipping.address.state,
                      sale.shipping.address.zipCode,
                    ]
                      .filter(Boolean)
                      .join(' - ')}
                    complement={sale.shipping.address.complement}
                  />
                )}
              </div>
            )}

            <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
              <SectionTitle icon={<Package className="h-4 w-4" />} title="Itens da venda" />
              <div className="mt-2 space-y-3">
                {sale.items.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                        <div className="text-xs text-gray-500 space-x-2">
                          {item.product.category && <span>{item.product.category}</span>}
                          {item.product.sku && <span>SKU: {item.product.sku}</span>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {item.quantity}x {formatCurrency(item.unitPrice)}
                        </p>
                        {item.notes && <p className="text-xs text-gray-500 italic mt-1">{item.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                        {canViewProfit && (() => {
                          // Calcular lucro do item: usar profit se disponível, senão calcular
                          let itemProfit = 0;
                          if (item.profit !== undefined && item.profit !== null) {
                            itemProfit = Number(item.profit);
                          } else if (item.costPrice !== undefined && item.costPrice !== null && item.unitPrice && item.quantity) {
                            const unitPrice = Number(item.unitPrice);
                            const costPrice = Number(item.costPrice);
                            const quantity = Number(item.quantity);
                            if (!isNaN(unitPrice) && !isNaN(costPrice) && !isNaN(quantity)) {
                              itemProfit = (unitPrice - costPrice) * quantity;
                            }
                          }
                          return itemProfit > 0 ? (
                            <p className="text-sm font-medium text-green-600 mt-1">
                              Lucro: {formatCurrency(itemProfit)}
                            </p>
                          ) : itemProfit === 0 && (item.profit !== undefined || item.costPrice !== undefined) ? (
                            <p className="text-sm text-gray-500 mt-1">
                              Lucro: {formatCurrency(0)}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
              <SectionTitle icon={<DollarSign className="h-4 w-4" />} title="Resumo financeiro" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile label="Subtotal" value={formatCurrency(totals.subtotal)} />
                <MetricTile label="Descontos" value={formatCurrency(-totals.discount)} accent="text-green-600" />
                <MetricTile label="Taxas" value={formatCurrency(totals.tax)} accent="text-red-600" />
                <MetricTile label="Frete" value={formatCurrency(totals.shipping)} />
              </div>
              {totals.additionalFees !== 0 && (
                <MetricTile label="Taxas adicionais" value={formatCurrency(totals.additionalFees)} />
              )}
              {canViewProfit && (totals.profit > 0 || (totals.profit === 0 && sale.items?.some((item: any) => item.profit !== undefined || item.costPrice !== undefined))) ? (
                <div className="flex justify-between text-lg font-semibold text-green-600 border-t pt-3">
                  <span>Lucro Total</span>
                  <span>{formatCurrency(totals.profit)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-3">
                <span>Total pago</span>
                <span>{formatCurrency(totals.gross)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Valor líquido</span>
                <span>{formatCurrency(totals.netAmount)}</span>
              </div>
              {sale.coupons && sale.coupons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Cupons aplicados</p>
                  <div className="flex flex-wrap gap-2">
                    {sale.coupons.map((coupon) => (
                      <span
                        key={coupon.code}
                        className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                      >
                        {coupon.code}
                        {coupon.value !== undefined && (
                          <span className="ml-1">
                            ({coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(sale.invoiceNumber || sale.invoiceIssuedAt || sale.invoiceDueDate) && (
              <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
                <SectionTitle icon={<FileText className="h-4 w-4" />} title="Faturamento" />
                <InfoList
                  items={[
                    { label: 'Número da nota', value: sale.invoiceNumber },
                    sale.invoiceUrl ? (
                      { label: 'Documento', value: <a href={sale.invoiceUrl} className="text-[#3e2626] underline" target="_blank" rel="noreferrer">Baixar nota</a> }
                    ) : undefined,
                    { label: 'Emitida em', value: formatDateTime(sale.invoiceIssuedAt) },
                    { label: 'Vencimento', value: formatDateTime(sale.invoiceDueDate) },
                  ].filter(Boolean) as { label: string; value?: ReactNode }[]}
                />
              </div>
            )}

            {sale.timeline && sale.timeline.length > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
                <SectionTitle icon={<CalendarClock className="h-4 w-4" />} title="Linha do tempo" />
                <div className="mt-2 space-y-4">
                  {sale.timeline.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 rounded-xl border p-3">
                      <div className="mt-1">
                        <CheckCircle2 className="h-4 w-4 text-[#3e2626]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{event.label}</p>
                        {event.description && <p className="text-sm text-gray-600">{event.description}</p>}
                        <p className="text-xs text-gray-400">{formatDateTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(sale.notes || sale.internalNotes) && (
              <div className="grid gap-4 md:grid-cols-2">
                {sale.notes && (
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <SectionTitle icon={<Info className="h-4 w-4" />} title="Observações do cliente" />
                    <p className="mt-2 text-gray-600 whitespace-pre-line">{sale.notes}</p>
                  </div>
                )}
                {sale.internalNotes && (
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <SectionTitle icon={<Box className="h-4 w-4" />} title="Notas internas" />
                    <p className="mt-2 text-gray-600 whitespace-pre-line">{sale.internalNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, helper, icon }: { label: string; value: string; helper?: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#3e2626]/10 p-3 text-[#3e2626]">{icon}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-900 break-all">{value}</p>
          {helper && <p className="text-xs text-gray-400">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  items,
  footer,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ label: string; value?: ReactNode }>;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
      <SectionTitle icon={icon} title={title} />
      <InfoList items={items} />
      {footer && <div>{footer}</div>}
    </div>
  );
}

function InfoList({ items }: { items: Array<{ label: string; value?: ReactNode }> }) {
  return (
    <div className="space-y-2 text-sm">
      {items
        .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
        .map((item) => (
          <div key={item.label} className="flex justify-between text-gray-600">
            <span>{item.label}</span>
            <span className="text-gray-900 text-right ml-3">
              {typeof item.value === 'string' || typeof item.value === 'number' ? item.value : item.value}
            </span>
          </div>
        ))}
    </div>
  );
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 text-sm">
      <p className="text-gray-500">{label}</p>
      <p className={`text-xl font-semibold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function AddressBlock({ title, address, cityLine, complement }: { title: string; address: string; cityLine: string; complement?: string }) {
  if (!address && !cityLine) return null;
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
      <p className="font-semibold text-gray-700 flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5" />
        {title}
      </p>
      {address && <p className="mt-1 text-gray-700">{address}</p>}
      {cityLine && <p>{cityLine}</p>}
      {complement && <p>Complemento: {complement}</p>}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
      {icon}
      {title}
    </div>
  );
}
