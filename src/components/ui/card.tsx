import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
}

export function Card({ 
  children, 
  className = '', 
  onClick, 
  href, 
  target, 
  rel 
}: CardProps) {
  const baseClasses = 'rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted';
  const classes = `${baseClasses} ${className}`;
  
  if (href) {
    return (
      <a 
        href={href} 
        target={target} 
        rel={rel} 
        className={classes}
      >
        {children}
      </a>
    );
  }
  
  return (
    <div 
      className={classes} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
} 