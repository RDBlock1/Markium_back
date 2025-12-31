import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export const formatVolume = (volume: number) => {
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M Vol.`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(2)}k Vol.`;
  return `$${volume} Vol.`;
};

export const formatOdds = (odds: number) => {
  if (odds === 0) return '0¢';
  if (odds < 1) return `${odds.toFixed(1)}¢`;
  return `${Math.round(odds)}¢`;
};