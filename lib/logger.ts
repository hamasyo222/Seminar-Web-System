interface LogContext {
  orderId?: string
  sessionId?: string
  paymentId?: string
  userId?: string
  email?: string
  [key: string]: any
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('INFO', message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error(this.formatMessage('ERROR', message, { ...context, error: errorMessage, stack }))
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, context))
    }
  }

  // 監査ログ用
  audit(action: string, userId: string, details: any) {
    this.info(`AUDIT: ${action}`, { userId, ...details })
  }

  // パフォーマンス計測用
  startTimer(label: string): () => void {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.info(`Performance: ${label}`, { duration: `${duration}ms` })
    }
  }
}

export const logger = new Logger()
