'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import SaleDetailsPanel from '@/components/SaleDetailsPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ManagerSaleDetailsPageProps {
  params: {
    saleId: string;
  };
}

export default function ManagerSaleDetailsPage({
  params,
}: ManagerSaleDetailsPageProps) {
  const router = useRouter();
  const { saleId } = use(params);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            Venda #{saleId}
          </p>
          <p className="text-sm text-gray-500">
            Detalhamento completo da venda realizada no PDV da loja
          </p>
        </div>
      </div>

      <SaleDetailsPanel saleId={saleId} />
    </div>
  );
}


