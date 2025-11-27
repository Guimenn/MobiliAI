'use client';

import dynamic from 'next/dynamic';
import Sidebar from '@/src/components/ui/Sidebar';
import TransformModeIndicator from '@/src/components/ui/TransformModeIndicator';
import ObjectInfo from '@/src/components/ui/ObjectInfo';

// Importação dinâmica para evitar problemas de SSR com Three.js
const Scene = dynamic(() => import('@/src/components/canvas/Scene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando cena 3D...</p>
      </div>
    </div>
  ),
});

export default function RoomSimulatorPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="ml-80 h-full">
        <Scene />
      </div>
      <TransformModeIndicator />
      <ObjectInfo />
    </div>
  );
}

