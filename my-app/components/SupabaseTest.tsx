'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Testar conexão básica
        const { data, error } = await supabase.from('products').select('count').limit(1);
        
        if (error) {
          // Se a tabela não existe, isso é normal para um teste inicial
          console.log('Tabela products não existe ainda:', error.message);
        }

        // Testar storage
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          throw new Error(`Erro ao listar buckets: ${bucketsError.message}`);
        }

        console.log('Buckets disponíveis:', buckets);
        
        const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images');
        
        if (!productImagesBucket) {
          throw new Error('Bucket "product-images" não encontrado. Crie o bucket no dashboard do Supabase.');
        }

        setConnectionStatus('success');
      } catch (error) {
        console.error('Erro na conexão:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
        setConnectionStatus('error');
      }
    };

    testConnection();
  }, []);

  if (connectionStatus === 'testing') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800">Testando conexão com Supabase...</span>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-red-800 font-semibold">Erro na conexão com Supabase</span>
        </div>
        <p className="text-red-700 text-sm">{errorMessage}</p>
        <div className="mt-3 text-xs text-red-600">
          <p><strong>Soluções:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Verifique se o arquivo .env.local está na pasta my-app/</li>
            <li>Confirme se as credenciais estão corretas</li>
            <li>Crie o bucket "product-images" no dashboard do Supabase</li>
            <li>Reinicie o servidor Next.js</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        <span className="text-green-800 font-semibold">✅ Supabase conectado com sucesso!</span>
      </div>
      <p className="text-green-700 text-sm mt-1">
        Bucket "product-images" encontrado e pronto para upload.
      </p>
    </div>
  );
}
