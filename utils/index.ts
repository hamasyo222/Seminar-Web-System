import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculateTax(priceIncludingTax: number, taxRate: number): {
  subtotal: number
  tax: number
  total: number
} {
  const subtotal = Math.floor(priceIncludingTax / (1 + taxRate / 100))
  const tax = priceIncludingTax - subtotal
  return { subtotal, tax, total: priceIncludingTax }
}

export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD${year}${month}${day}${random}`
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatPhoneNumber(phone: string): string {
  // 日本の電話番号形式に整形
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    // 0X0-XXXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 11) {
    // 0XX-XXXX-XXXX or 090-XXXX-XXXX
    if (cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    }
  }
  return phone
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'エラーが発生しました'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getSessionFormat(format: string): string {
  const formats: Record<string, string> = {
    OFFLINE: 'オフライン',
    ONLINE: 'オンライン',
    HYBRID: 'ハイブリッド'
  }
  return formats[format] || format
}

export function getOrderStatus(status: string): string {
  const statuses: Record<string, string> = {
    PENDING: '支払待ち',
    PAID: '支払済み',
    CANCELLED: 'キャンセル',
    REFUNDED: '返金済み',
    EXPIRED: '期限切れ'
  }
  return statuses[status] || status
}

export function getPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    CREDIT_CARD: 'クレジットカード',
    KONBINI: 'コンビニ決済',
    PAYPAY: 'PayPay',
    BANK_TRANSFER: '銀行振込'
  }
  return methods[method] || method
}

export function getAttendanceStatus(status: string): string {
  const statuses: Record<string, string> = {
    NOT_CHECKED_IN: '未受付',
    CHECKED_IN: '受付済み',
    NO_SHOW: '欠席'
  }
  return statuses[status] || status
}

// CSVエクスポート用
export function downloadCSV(filename: string, data: any[], headers: string[]) {
  // BOMを追加（Excelで開いた時の文字化け対策）
  const BOM = '\uFEFF'
  
  // ヘッダー行
  const headerRow = headers.join(',')
  
  // データ行
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header] ?? ''
      // カンマや改行を含む場合はダブルクォートで囲む
      if (String(value).includes(',') || String(value).includes('\n')) {
        return `"${String(value).replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  })
  
  const csv = BOM + headerRow + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
