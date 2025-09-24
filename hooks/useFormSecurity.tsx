'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

declare global {
  interface Window {
    grecaptcha?: {
      execute(siteKey: string, options: { action: string }): Promise<string>
      ready?(callback: () => void): void
    }
  }
}

interface FormSecurityOptions {
  maxSubmitAttempts?: number
  submitCooldown?: number // ミリ秒
  detectAutofill?: boolean
  honeypotField?: string
  csrfToken?: string
}

export function useFormSecurity(options: FormSecurityOptions = {}) {
  const {
    maxSubmitAttempts = 3,
    submitCooldown = 1000,
    detectAutofill = true,
    honeypotField = 'website',
    csrfToken
  } = options

  const router = useRouter()
  const [submitAttempts, setSubmitAttempts] = useState(0)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  const [isAutofilled, setIsAutofilled] = useState(false)
  const [honeypotValue, setHoneypotValue] = useState('')
  const formStartTime = useRef(Date.now())
  const interactionCount = useRef(0)

  // フォーム操作の追跡
  useEffect(() => {
    const handleInteraction = () => {
      interactionCount.current += 1
    }

    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  // オートフィルの検出
  useEffect(() => {
    if (!detectAutofill) return

    const checkAutofill = () => {
      const inputs = document.querySelectorAll('input:-webkit-autofill')
      if (inputs.length > 0) {
        setIsAutofilled(true)
      }
    }

    // 遅延チェック（オートフィルは少し遅れて適用される）
    const timeout = setTimeout(checkAutofill, 100)
    const interval = setInterval(checkAutofill, 500)

    // 5秒後にチェックを停止
    setTimeout(() => clearInterval(interval), 5000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [detectAutofill])

  // セキュリティチェック
  const performSecurityChecks = useCallback((): { isValid: boolean; reason?: string } => {
    const now = Date.now()

    // 1. 送信回数チェック
    if (submitAttempts >= maxSubmitAttempts) {
      return {
        isValid: false,
        reason: '送信回数の上限に達しました。しばらくしてからお試しください。'
      }
    }

    // 2. クールダウンチェック
    if (now - lastSubmitTime < submitCooldown) {
      return {
        isValid: false,
        reason: '連続した送信はできません。少しお待ちください。'
      }
    }

    // 3. ハニーポットチェック
    if (honeypotValue) {
      console.warn('Honeypot field filled:', honeypotValue)
      return {
        isValid: false,
        reason: 'セキュリティチェックに失敗しました。'
      }
    }

    // 4. フォーム操作時間チェック（ボット対策）
    const formDuration = now - formStartTime.current
    if (formDuration < 3000) { // 3秒未満
      return {
        isValid: false,
        reason: 'フォームの入力が早すぎます。'
      }
    }

    // 5. インタラクションチェック
    if (interactionCount.current < 3) {
      console.warn('Low interaction count:', interactionCount.current)
      return {
        isValid: false,
        reason: 'フォームの操作が検出されませんでした。'
      }
    }

    return { isValid: true }
  }, [submitAttempts, lastSubmitTime, honeypotValue, maxSubmitAttempts, submitCooldown])

  // 送信前のセキュリティチェック
  const validateSubmission = useCallback(async (): Promise<boolean> => {
    const checks = performSecurityChecks()
    
    if (!checks.isValid) {
      toast.error(checks.reason || 'セキュリティチェックに失敗しました')
      
      // 不審なアクティビティをログに記録
      try {
        await fetch('/api/security/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'FORM_SECURITY_VIOLATION',
            reason: checks.reason,
            metadata: {
              submitAttempts,
              formDuration: Date.now() - formStartTime.current,
              interactionCount: interactionCount.current,
              isAutofilled
            }
          })
        })
      } catch (error) {
        console.error('Failed to log security event:', error)
      }

      return false
    }

    // 成功した場合、カウンターを更新
    setSubmitAttempts(prev => prev + 1)
    setLastSubmitTime(Date.now())

    return true
  }, [performSecurityChecks, submitAttempts, isAutofilled])

  // ハニーポットフィールドコンポーネント
  const HoneypotField = useCallback(() => (
    <input
      type="text"
      name={honeypotField}
      value={honeypotValue}
      onChange={(e) => setHoneypotValue(e.target.value)}
      tabIndex={-1}
      autoComplete="off"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    />
  ), [honeypotField, honeypotValue])

  // CSRFトークンフィールド
  const CSRFTokenField = useCallback(() => {
    if (!csrfToken) return null
    
    return (
      <input
        type="hidden"
        name="csrfToken"
        value={csrfToken}
      />
    )
  }, [csrfToken])

  // フォーム送信のラッパー
  const secureSubmit = useCallback(async (submitFn: () => Promise<void>) => {
    const isValid = await validateSubmission()
    
    if (!isValid) {
      return
    }

    try {
      await submitFn()
    } catch (error) {
      // エラーが発生した場合もカウントする
      setSubmitAttempts(prev => prev + 1)
      throw error
    }
  }, [validateSubmission])

  return {
    validateSubmission,
    secureSubmit,
    HoneypotField,
    CSRFTokenField,
    securityStatus: {
      submitAttempts,
      remainingAttempts: maxSubmitAttempts - submitAttempts,
      isAutofilled,
      formDuration: Date.now() - formStartTime.current,
      interactionCount: interactionCount.current
    }
  }
}

// reCAPTCHA v3 統合
export function useRecaptcha(siteKey: string) {
  const [isReady, setIsReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // reCAPTCHAスクリプトの読み込み
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setIsReady(true)
    }

    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [siteKey])

  const execute = useCallback(async (action: string): Promise<string | null> => {
    if (!isReady || !window.grecaptcha) {
      console.error('reCAPTCHA not ready')
      return null
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action })
      setToken(token)
      return token
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error)
      return null
    }
  }, [isReady, siteKey])

  return {
    isReady,
    token,
    execute
  }
}
