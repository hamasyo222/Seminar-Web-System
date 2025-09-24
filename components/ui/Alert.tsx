import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

const variants = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700'
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-400',
    titleColor: 'text-green-800',
    textColor: 'text-green-700'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: AlertCircle,
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-800',
    textColor: 'text-yellow-700'
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-400',
    titleColor: 'text-red-800',
    textColor: 'text-red-700'
  }
}

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className
}: AlertProps) {
  const styles = variants[variant]
  const Icon = styles.icon

  return (
    <div className={clsx('rounded-md border p-4', styles.container, className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', styles.iconColor)} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-medium', styles.titleColor)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', title ? 'mt-2' : '', styles.textColor)}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  variant === 'info' && 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600',
                  variant === 'success' && 'text-green-500 hover:bg-green-100 focus:ring-green-600',
                  variant === 'warning' && 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
                  variant === 'error' && 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                )}
              >
                <span className="sr-only">閉じる</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface InlineAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
  className?: string
}

export function InlineAlert({
  variant = 'info',
  children,
  className
}: InlineAlertProps) {
  const styles = variants[variant]
  const Icon = styles.icon

  return (
    <div className={clsx('flex items-start space-x-2', className)}>
      <Icon className={clsx('h-5 w-5 flex-shrink-0', styles.iconColor)} aria-hidden="true" />
      <span className={clsx('text-sm', styles.textColor)}>{children}</span>
    </div>
  )
}

