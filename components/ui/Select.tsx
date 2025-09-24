import { forwardRef, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'filled' | 'flushed'
  isInvalid?: boolean
}

const variants = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  filled: 'bg-gray-100 border-transparent focus:bg-white focus:border-blue-500',
  flushed: 'border-0 border-b-2 border-gray-300 rounded-none px-0 focus:border-blue-500'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  isInvalid,
  className,
  children,
  ...props
}, ref) => {
  const hasError = isInvalid || !!error

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={twMerge(
          clsx(
            'block w-full rounded-md shadow-sm sm:text-sm',
            'transition-colors duration-200',
            variants[variant],
            hasError && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            className
          )
        )}
        aria-invalid={hasError}
        aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${props.id}-error`}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${props.id}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select




