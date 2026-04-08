'use client'

import React from 'react'
import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  href?: undefined
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  type?: never
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-accent to-accent-purple text-darkest font-bold',
    'hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,212,255,0.4)]',
    'active:translate-y-0',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
  ].join(' '),
  secondary: [
    'border border-accent/35 text-accent bg-transparent font-semibold',
    'hover:border-accent/70 hover:bg-accent/8 hover:-translate-y-0.5',
    'hover:shadow-[0_4px_20px_rgba(0,212,255,0.15)]',
    'active:translate-y-0',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'text-accent-off bg-transparent font-medium',
    'hover:text-white hover:bg-dark-highlight/60',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
}

const Spinner: React.FC = () => (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

export const Button: React.FC<ButtonProps> = (props) => {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    className = '',
  } = props

  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dark',
    'select-none',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isDisabled = disabled || loading

  const content = (
    <>
      {loading && <Spinner />}
      <span className={loading ? 'opacity-80' : ''}>{children}</span>
    </>
  )

  if (props.href !== undefined) {
    return (
      <Link
        href={props.href}
        onClick={props.onClick as React.MouseEventHandler<HTMLAnchorElement>}
        className={baseClasses}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={isDisabled}
      className={baseClasses}
    >
      {content}
    </button>
  )
}

export default Button
