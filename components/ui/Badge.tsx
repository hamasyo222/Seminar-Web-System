import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  dot?: boolean
  className?: string
}

const variants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-indigo-100 text-indigo-800'
}

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1'
}

function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  className
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium',
          variants[variant],
          sizes[size],
          rounded ? 'rounded-full' : 'rounded',
          className
        )
      )}
    >
      {dot && (
        <svg
          className={clsx(
            'h-2 w-2',
            size === 'sm' ? '-ml-0.5 mr-1' : '-ml-1 mr-1.5'
          )}
          fill="currentColor"
          viewBox="0 0 8 8"
        >
          <circle cx={4} cy={4} r={3} />
        </svg>
      )}
      {children}
    </span>
  )
}

export default Badge
export { Badge }

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning'
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'アクティブ' },
    inactive: { variant: 'default' as const, label: '非アクティブ' },
    pending: { variant: 'warning' as const, label: '保留中' },
    success: { variant: 'success' as const, label: '成功' },
    error: { variant: 'danger' as const, label: 'エラー' },
    warning: { variant: 'warning' as const, label: '警告' }
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} size={size} rounded dot>
      {label || config.label}
    </Badge>
  )
}

interface CountBadgeProps {
  count: number
  max?: number
  variant?: BadgeProps['variant']
  size?: BadgeProps['size']
  className?: string
}

export function CountBadge({
  count,
  max = 99,
  variant = 'primary',
  size = 'sm',
  className
}: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge
      variant={variant}
      size={size}
      rounded
      className={twMerge('min-w-[1.5rem] text-center', className)}
    >
      {displayCount}
    </Badge>
  )
}
