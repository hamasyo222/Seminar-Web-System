import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, required, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
              error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              props.disabled && 'bg-gray-100 cursor-not-allowed',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, required, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={twMerge(
            clsx(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
              error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              props.disabled && 'bg-gray-100 cursor-not-allowed',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, required, options, placeholder, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={twMerge(
            clsx(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
              error && 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500',
              props.disabled && 'bg-gray-100 cursor-not-allowed',
              className
            )
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div>
        <label className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            className={twMerge(
              clsx(
                'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5',
                error && 'border-red-300',
                props.disabled && 'bg-gray-100 cursor-not-allowed',
                className
              )
            )}
            {...props}
          />
          {(label || children) && (
            <span className="ml-2 text-sm text-gray-700">
              {label || children}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 ml-6">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div>
        <label className="flex items-center">
          <input
            ref={ref}
            type="radio"
            className={twMerge(
              clsx(
                'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
                error && 'border-red-300',
                props.disabled && 'bg-gray-100 cursor-not-allowed',
                className
              )
            )}
            {...props}
          />
          {(label || children) && (
            <span className="ml-2 text-sm text-gray-700">
              {label || children}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 ml-6">{error}</p>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'

