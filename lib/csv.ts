import { formatJST } from './date'
import { formatCurrency, getOrderStatus, getPaymentMethod, getAttendanceStatus } from '@/utils'
import type { OrderWithDetails, ParticipantWithDetails } from '@/types'

// BOMを追加（Excelで開いた時の文字化け対策）
const BOM = '\uFEFF'

// CSVの値をエスケープ
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  
  const str = String(value)
  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 注文一覧CSV生成
export function generateOrdersCSV(orders: OrderWithDetails[]): string {
  const headers = [
    '注文番号',
    '注文日時',
    'ステータス',
    'セミナー名',
    '開催日時',
    '申込者名',
    'フリガナ',
    'メールアドレス',
    '電話番号',
    '会社名',
    '参加人数',
    '支払方法',
    '小計',
    '消費税',
    '合計金額',
    '支払完了日時',
    '備考'
  ]

  const rows = orders.map(order => [
    order.orderNumber,
    formatJST(order.createdAt),
    getOrderStatus(order.status),
    order.session.seminar.title,
    formatJST(order.session.startAt),
    order.name,
    order.nameKana || '',
    order.email,
    order.phone || '',
    order.company || '',
    order.participants.length,
    order.paymentMethod ? getPaymentMethod(order.paymentMethod) : '',
    order.subtotal,
    order.tax,
    order.total,
    order.paidAt ? formatJST(order.paidAt) : '',
    order.notes || ''
  ])

  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n')

  return BOM + csvContent
}

// 参加者一覧CSV生成
export function generateParticipantsCSV(participants: ParticipantWithDetails[]): string {
  const headers = [
    '注文番号',
    'セミナー名',
    '開催日時',
    '参加者名',
    'フリガナ',
    'メールアドレス',
    '会社名',
    '受付状態',
    '受付日時',
    '受付者',
    'Zoom登録',
    '申込者名',
    '申込者メール',
    '申込日時'
  ]

  const rows = participants.map(participant => [
    participant.order.orderNumber,
    participant.order.session.seminar.title,
    formatJST(participant.order.session.startAt),
    participant.name,
    participant.nameKana || '',
    participant.email,
    participant.company || '',
    getAttendanceStatus(participant.attendanceStatus),
    participant.checkedInAt ? formatJST(participant.checkedInAt) : '',
    participant.checkedInBy || '',
    participant.zoomRegistrations.some(zr => zr.status === 'REGISTERED') ? '登録済み' : '未登録',
    participant.order.name,
    participant.order.email,
    formatJST(participant.order.createdAt)
  ])

  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n')

  return BOM + csvContent
}

// チケット売上CSV生成
export function generateTicketSalesCSV(data: any[]): string {
  const headers = [
    'セミナー名',
    '開催日時',
    '会場',
    'チケット種別',
    '単価',
    '販売数',
    '売上金額',
    '在庫数',
    '残席数'
  ]

  const rows = data.map(item => [
    item.seminarTitle,
    formatJST(item.startAt),
    item.venue || 'オンライン',
    item.ticketName,
    item.price,
    item.soldCount,
    item.revenue,
    item.stock,
    item.remaining
  ])

  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n')

  return BOM + csvContent
}

// 返金一覧CSV生成
export function generateRefundsCSV(refunds: any[]): string {
  const headers = [
    '注文番号',
    'セミナー名',
    '申込者名',
    '返金金額',
    '返金理由',
    '返金方法',
    'ステータス',
    '申請日',
    '処理日',
    '申請者',
    '処理者'
  ]

  const rows = refunds.map(refund => [
    refund.order.orderNumber,
    refund.order.session.seminar.title,
    refund.order.name,
    formatCurrency(refund.amount),
    refund.reason,
    refund.method === 'CREDIT_CARD' ? 'クレジットカード' : '銀行振込',
    refund.status,
    formatJST(refund.requestedAt),
    refund.processedAt ? formatJST(refund.processedAt) : '',
    refund.requestedBy,
    refund.processedBy || ''
  ])

  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n')

  return BOM + csvContent
}

// 汎用CSV生成関数
export function generateCSV(headers: string[], rows: any[][]): string {
  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n')

  return BOM + csvContent
}
