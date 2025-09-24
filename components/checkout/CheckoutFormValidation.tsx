'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { InlineAlert } from '@/components/ui/Alert'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ValidationStatus {
  isValid: boolean
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

interface CheckoutFormValidationProps {
  form: UseFormReturn<any>
  currentStep: 'tickets' | 'info' | 'payment' | 'confirm'
}

export default function CheckoutFormValidation({ form, currentStep }: CheckoutFormValidationProps) {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus[]>([])
  const { watch, formState: { errors } } = form

  // 監視対象のフィールド
  const watchedFields = watch()

  useEffect(() => {
    const statuses: ValidationStatus[] = []

    // チケット選択のバリデーション
    if (currentStep === 'tickets') {
      const tickets = watchedFields.tickets || []
      const totalQuantity = tickets.reduce((sum: number, t: any) => sum + t.quantity, 0)

      if (totalQuantity === 0) {
        statuses.push({
          isValid: false,
          message: 'チケットを選択してください',
          type: 'info'
        })
      } else if (totalQuantity > 20) {
        statuses.push({
          isValid: false,
          message: '合計枚数は20枚までです',
          type: 'error'
        })
      } else {
        statuses.push({
          isValid: true,
          message: `${totalQuantity}枚のチケットが選択されています`,
          type: 'success'
        })
      }
    }

    // 申込者情報のバリデーション
    if (currentStep === 'info') {
      // メールアドレスの形式チェック
      const email = watchedFields.email
      if (email && isDisposableEmail(email)) {
        statuses.push({
          isValid: false,
          message: '使い捨てメールアドレスは使用できません',
          type: 'warning'
        })
      }

      // 電話番号の形式チェック
      const phone = watchedFields.phone
      if (phone && !isValidPhoneNumber(phone)) {
        statuses.push({
          isValid: false,
          message: '電話番号の形式が正しくありません（例: 090-1234-5678）',
          type: 'error'
        })
      }

      // 参加者情報の重複チェック
      const participants = watchedFields.participants || []
      const emails = participants.map((p: any) => p.email?.toLowerCase()).filter(Boolean)
      const uniqueEmails = new Set(emails)
      if (emails.length !== uniqueEmails.size) {
        statuses.push({
          isValid: false,
          message: '参加者のメールアドレスが重複しています',
          type: 'error'
        })
      }
    }

    // 支払方法のバリデーション
    if (currentStep === 'payment') {
      const paymentMethod = watchedFields.paymentMethod
      if (!paymentMethod) {
        statuses.push({
          isValid: false,
          message: '支払方法を選択してください',
          type: 'info'
        })
      } else {
        const methodNames: Record<string, string> = {
          CREDIT_CARD: 'クレジットカード',
          KONBINI: 'コンビニ決済',
          PAYPAY: 'PayPay',
          BANK_TRANSFER: '銀行振込'
        }
        statuses.push({
          isValid: true,
          message: `${methodNames[paymentMethod]}が選択されています`,
          type: 'success'
        })

        if (paymentMethod === 'KONBINI') {
          statuses.push({
            isValid: true,
            message: 'お支払い期限は発行から3日間です',
            type: 'info'
          })
        }
      }
    }

    // 最終確認のバリデーション
    if (currentStep === 'confirm') {
      if (!watchedFields.agreeToTerms) {
        statuses.push({
          isValid: false,
          message: '利用規約への同意が必要です',
          type: 'error'
        })
      }
      if (!watchedFields.agreeToCancellationPolicy) {
        statuses.push({
          isValid: false,
          message: 'キャンセルポリシーへの同意が必要です',
          type: 'error'
        })
      }
    }

    setValidationStatus(statuses)
  }, [watchedFields, currentStep])

  // 使い捨てメールアドレスのチェック
  function isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      '10minutemail.com',
      'mailinator.com'
    ]
    const domain = email.split('@')[1]?.toLowerCase()
    return domain ? disposableDomains.includes(domain) : false
  }

  // 電話番号の形式チェック
  function isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/-/g, '')
    const phoneRegex = /^(0[5-9]0[0-9]{8}|0[1-9][1-9][0-9]{7})$/
    return phoneRegex.test(cleaned)
  }

  if (validationStatus.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 mb-4">
      {validationStatus.map((status, index) => (
        <InlineAlert
          key={index}
          variant={status.type}
          className="text-sm"
        >
          {status.message}
        </InlineAlert>
      ))}
    </div>
  )
}

// フィールドごとのリアルタイムバリデーションフィードバック
export function FieldValidationFeedback({ 
  fieldName, 
  value, 
  error 
}: { 
  fieldName: string
  value: any
  error?: any 
}) {
  const [feedback, setFeedback] = useState<ValidationStatus | null>(null)

  useEffect(() => {
    if (!value) {
      setFeedback(null)
      return
    }

    // フィールドごとのカスタムバリデーション
    switch (fieldName) {
      case 'email':
        if (value && value.includes('@')) {
          const domain = value.split('@')[1]
          if (isStrongEmailDomain(domain)) {
            setFeedback({
              isValid: true,
              message: '有効なメールアドレスです',
              type: 'success'
            })
          }
        }
        break

      case 'phone':
        if (value && value.length >= 10) {
          if (isValidPhoneNumber(value)) {
            setFeedback({
              isValid: true,
              message: '有効な電話番号です',
              type: 'success'
            })
          }
        }
        break

      case 'nameKana':
        if (value && /^[\u30A0-\u30FF\s]+$/.test(value)) {
          setFeedback({
            isValid: true,
            message: 'カタカナで正しく入力されています',
            type: 'success'
          })
        }
        break

      default:
        setFeedback(null)
    }
  }, [fieldName, value])

  // 強力なメールドメインかチェック
  function isStrongEmailDomain(domain: string): boolean {
    const trustedDomains = [
      'gmail.com', 'yahoo.co.jp', 'outlook.jp', 'icloud.com',
      'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp'
    ]
    return trustedDomains.includes(domain?.toLowerCase())
  }

  function isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/-/g, '')
    return /^(0[5-9]0[0-9]{8}|0[1-9][1-9][0-9]{7})$/.test(cleaned)
  }

  if (error) {
    return (
      <div className="mt-1 flex items-center text-sm text-red-600">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error.message}
      </div>
    )
  }

  if (feedback) {
    const Icon = feedback.isValid ? CheckCircle : AlertCircle
    const colorClass = feedback.isValid ? 'text-green-600' : 'text-yellow-600'
    
    return (
      <div className={`mt-1 flex items-center text-sm ${colorClass}`}>
        <Icon className="w-4 h-4 mr-1" />
        {feedback.message}
      </div>
    )
  }

  return null
}

