'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastProps, ToastType } from '@/components/ui/toast';
import { generateId } from '@/lib/utils';

interface ToastContextData {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = generateId();
    
    setToasts((prevToasts) => [
      ...prevToasts,
      {
        id,
        message,
        type,
        duration,
        onClose: () => {},
      },
    ]);
  }, []);

  const handleCloseToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  
  return context;
} 