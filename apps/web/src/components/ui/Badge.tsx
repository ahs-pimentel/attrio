'use client';

import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

/**
 * Badge - Componente de badge/tag para status e categorias
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'sm', children, ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-600',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-cyan-100 text-cyan-800',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center font-semibold rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * StatusBadge - Badge especifico para status de assembleias e pautas
 */
interface StatusBadgeProps {
  status: string;
  type?: 'assembly' | 'agenda' | 'minutes';
  className?: string;
}

export function StatusBadge({ status, type = 'assembly', className = '' }: StatusBadgeProps) {
  // Mapeamento de status para variantes e labels
  const statusConfig: Record<string, Record<string, { variant: BadgeVariant; label: string }>> = {
    assembly: {
      SCHEDULED: { variant: 'primary', label: 'Agendada' },
      IN_PROGRESS: { variant: 'success', label: 'Em Andamento' },
      FINISHED: { variant: 'secondary', label: 'Encerrada' },
      CANCELLED: { variant: 'danger', label: 'Cancelada' },
    },
    agenda: {
      PENDING: { variant: 'default', label: 'Pendente' },
      VOTING: { variant: 'warning', label: 'Em Votacao' },
      VOTED: { variant: 'success', label: 'Votada' },
      CANCELLED: { variant: 'danger', label: 'Cancelada' },
    },
    minutes: {
      DRAFT: { variant: 'default', label: 'Rascunho' },
      PENDING_REVIEW: { variant: 'warning', label: 'Aguardando Revisao' },
      APPROVED: { variant: 'info', label: 'Aprovada' },
      PUBLISHED: { variant: 'success', label: 'Publicada' },
    },
  };

  const config = statusConfig[type]?.[status] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
