'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { env } from '@/lib/env';

interface BackendStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      // Testar o endpoint público de produtos
      const response = await fetch(`${env.API_URL}/public/products?limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const online = response.ok;
      setIsOnline(online);
      setLastChecked(new Date());
      onStatusChange?.(online);
    } catch {
      setIsOnline(false);
      setLastChecked(new Date());
      onStatusChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (isOnline === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (isOnline === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isChecking) {
      return 'Verificando...';
    }
    
    if (isOnline === true) {
      return 'Backend Online';
    }
    
    if (isOnline === false) {
      return 'Backend Offline';
    }
    
    return 'Status Desconhecido';
  };

  const getStatusColor = () => {
    if (isOnline === true) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    
    if (isOnline === false) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {lastChecked && (
        <span className="text-xs opacity-75">
          ({lastChecked.toLocaleTimeString()})
        </span>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={checkBackendStatus}
        disabled={isChecking}
        className="h-6 w-6 p-0 hover:bg-transparent"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
