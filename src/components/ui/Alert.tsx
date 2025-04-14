import React from 'react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export default function Alert({ type = 'error', message, className = '' }: AlertProps) {
  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-600',
    success: 'bg-green-50 border-green-200 text-green-600',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
  };

  return (
    <div className={`border px-4 py-3 rounded-md ${typeClasses[type]} ${className}`}>
      {message}
    </div>
  );
} 