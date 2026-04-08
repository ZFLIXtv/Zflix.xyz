import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-accent/15 border border-accent/30 text-accent',
  success: 'bg-green-500/15 border border-green-500/30 text-green-400',
  warning: 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
  danger: 'bg-red-500/15 border border-red-500/30 text-red-400',
  info: 'bg-sky-500/15 border border-sky-500/30 text-sky-400',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const classes = [
    'inline-flex items-center gap-1 font-medium rounded-full',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}

export default Badge
