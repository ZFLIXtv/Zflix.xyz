import React from 'react'

interface InputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  type?: React.HTMLInputTypeAttribute
  id?: string
  name?: string
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  autoComplete?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  autoComplete,
}) => {
  const inputId = id ?? name

  const inputClasses = [
    'w-full bg-dark-apparent border rounded-xl text-[#E8F4FA] placeholder:text-accent-off/60',
    'py-2.5 text-sm transition-all duration-200',
    'focus:outline-none',
    error
      ? 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.15)]'
      : 'border-accent/20 focus:border-accent focus:shadow-[0_0_10px_rgba(189,230,251,0.15)]',
    leftIcon ? 'pl-10' : 'pl-4',
    rightIcon ? 'pr-10' : 'pr-4',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#E8F4FA]"
        >
          {label}
          {required && (
            <span className="ml-1 text-accent" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-off pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
              ? `${inputId}-hint`
              : undefined
          }
          className={inputClasses}
        />

        {rightIcon && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-off"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-red-400 flex items-center gap-1"
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {!error && hint && (
        <p
          id={`${inputId}-hint`}
          className="text-xs text-accent-off"
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export default Input
