import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'yellow' | 'green' | 'orange' | 'red' | 'gray';
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
};

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'PENDIENTE':
      return 'yellow';
    case 'PAGADO':
      return 'green';
    case 'PARCIAL':
      return 'orange';
    case 'CANCELADO':
      return 'red';
    default:
      return 'gray';
  }
}
