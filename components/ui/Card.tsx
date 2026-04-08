import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
}) => {
  const classes = [
    'bg-dark-apparent/80 border border-accent/10 rounded-xl backdrop-blur-md',
    hover
      ? 'transition-all duration-200 hover:-translate-y-1 cursor-pointer'
      : '',
    glow && hover
      ? 'hover:shadow-[0_0_24px_rgba(189,230,251,0.12)] hover:border-accent/25'
      : glow
      ? 'hover:shadow-[0_0_24px_rgba(189,230,251,0.12)] hover:border-accent/25'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}

export default Card
