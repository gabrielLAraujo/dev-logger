import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Carregando...',
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && <span className="ml-2 text-sm text-gray-500">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 