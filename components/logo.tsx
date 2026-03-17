import { cn } from '@/lib/utils'
import Link from 'next/link'

interface LogoProps {
  variant?: 'default' | 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  href?: string
}

export function Logo({ 
  variant = 'default', 
  size = 'md', 
  showText = true,
  className,
  href,
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const colorClasses = {
    default: 'text-primary',
    light: 'text-primary-foreground',
    dark: 'text-foreground',
  }

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Stylized "E" with chart bars */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeClasses[size], colorClasses[variant])}
      >
        <rect
          x="4"
          y="4"
          width="32"
          height="32"
          rx="8"
          className="fill-current"
        />
        <path
          d="M12 28V20M18 28V16M24 28V12M30 28V18"
          stroke={variant === 'light' ? '#1E3A5F' : 'white'}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      
      {showText && (
        <div className={cn('font-semibold tracking-tight', textSizes[size], colorClasses[variant])}>
          <span>Elev</span>
          <span className="text-accent">AI</span>
          <span>te</span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
