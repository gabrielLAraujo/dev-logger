import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera um ID único para toasts
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
} 