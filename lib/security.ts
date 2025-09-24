import crypto from 'crypto'

// XSS対策: HTMLエスケープ
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// SQLインジェクション対策: 特殊文字のエスケープ（Prismaを使用していれば基本的に不要）
export function escapeSql(text: string): string {
  return text.replace(/['";\\]/g, (m) => '\\' + m)
}

// CSRF対策: トークン生成
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// CSRF対策: トークン検証
export function verifyCsrfToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64
}

// セッションID生成
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

// パスワード強度チェック
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // 長さチェック
  if (password.length >= 8) score++
  else feedback.push('パスワードは8文字以上にしてください')
  
  if (password.length >= 12) score++

  // 文字種チェック
  if (/[a-z]/.test(password)) score++
  else feedback.push('小文字を含めてください')
  
  if (/[A-Z]/.test(password)) score++
  else feedback.push('大文字を含めてください')
  
  if (/[0-9]/.test(password)) score++
  else feedback.push('数字を含めてください')
  
  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('記号を含めることを推奨します')

  // 一般的な弱いパスワードチェック
  const weakPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein'
  ]
  
  if (weakPasswords.includes(password.toLowerCase())) {
    score = 0
    feedback.push('よく使われる弱いパスワードです')
  }

  return {
    score: Math.min(score, 5),
    feedback
  }
}

// IPアドレスの検証
export function isValidIpAddress(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  
  // IPv6 (簡易チェック)
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i
  return ipv6Regex.test(ip)
}

// レート制限キー生成
export function getRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`
}

// 暗号化
export function encrypt(text: string, secretKey: string): string {
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(secretKey, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

// 復号化
export function decrypt(encryptedText: string, secretKey: string): string {
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(secretKey, 'salt', 32)
  
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// ファイルアップロードの検証
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number // バイト
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options

  // ファイルサイズチェック
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `ファイルサイズは${Math.round(maxSize / 1024 / 1024)}MB以下にしてください`
    }
  }

  // MIMEタイプチェック
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '許可されていないファイル形式です'
    }
  }

  // 拡張子チェック
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: '許可されていない拡張子です'
    }
  }

  return { valid: true }
}

// セキュアなランダム文字列生成
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  
  return result
}
