'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface ProductsHeaderContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onCreateProduct: () => void;
  setOnCreateProduct: (handler: () => void) => void;
}

const ProductsHeaderContext = createContext<ProductsHeaderContextType | undefined>(undefined);

export function ProductsHeaderProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const onCreateProductRef = useRef<() => void>(() => {});

  const onCreateProduct = () => {
    onCreateProductRef.current();
  };

  const setOnCreateProduct = (handler: () => void) => {
    onCreateProductRef.current = handler;
  };

  return (
    <ProductsHeaderContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        viewMode,
        setViewMode,
        onCreateProduct,
        setOnCreateProduct,
      }}
    >
      {children}
    </ProductsHeaderContext.Provider>
  );
}

export function useProductsHeader() {
  const context = useContext(ProductsHeaderContext);
  if (context === undefined) {
    throw new Error('useProductsHeader must be used within a ProductsHeaderProvider');
  }
  return context;
}

