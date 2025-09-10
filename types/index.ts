import { 
  Seminar, Session, TicketType, Order, OrderItem, 
  Participant, Payment, Refund, AdminUser, CancellationPolicy,
  ZoomRegistration, Invoice, EmailTemplate, Coupon
} from '@prisma/client'

// セミナー詳細（関連データ含む）
export interface SeminarWithDetails extends Seminar {
  sessions: SessionWithDetails[]
  cancellationPolicy: CancellationPolicy | null
}

// セッション詳細（関連データ含む）
export interface SessionWithDetails extends Session {
  seminar: Seminar
  ticketTypes: TicketType[]
  _count?: {
    orders: number
  }
}

// 注文詳細（関連データ含む）
export interface OrderWithDetails extends Order {
  session: Session & { seminar: Seminar }
  orderItems: (OrderItem & { ticketType: TicketType })[]
  participants: Participant[]
  payments: Payment[]
  refunds: Refund[]
  invoices: Invoice[]
}

// 参加者詳細
export interface ParticipantWithDetails extends Participant {
  order: Order & { session: Session & { seminar: Seminar } }
  zoomRegistrations: ZoomRegistration[]
}

// KOMOJU関連
export interface KomojuSessionResponse {
  id: string
  resource: string
  mode: string
  amount: number
  currency: string
  session_url: string
  return_url: string
  default_locale: string
  payment_methods: string[]
  created_at: string
  updated_at: string
  status: string
  payment?: {
    id: string
    resource: string
    status: string
    amount: number
    tax: number
    customer: any
    payment_method_fee: number
    total: number
    currency: string
    description: string
    captured_at: string
    external_order_num: string
    metadata: any
  }
}

export interface KomojuWebhookPayload {
  id: string
  type: string // payment.captured, payment.expired, etc.
  resource: string
  data: any
  created_at: string
}

// Zoom関連
export interface ZoomTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}

export interface ZoomRegistrant {
  email: string
  first_name: string
  last_name?: string
  custom_questions?: Array<{
    title: string
    value: string
  }>
}

export interface ZoomRegistrationResponse {
  registrant_id: string
  id: string
  topic: string
  start_time: string
  join_url: string
}

// メール関連
export interface EmailData {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  templateCode?: string
  variables?: Record<string, any>
  htmlContent?: string
  textContent?: string
  attachments?: Array<{
    filename: string
    content: string // base64
    type: string
  }>
}

// キャンセルポリシールール
export interface CancellationRule {
  daysBefore: number
  refundRate: number // 0-100%
}

// 領収書データ
export interface InvoiceData {
  order: OrderWithDetails
  issuerName: string
  issuerTaxId: string
  issuerAddress: string
  issuerTel: string
  recipientName: string
  recipientInfo?: string // 会社名、部署、役職など
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    taxRate: number
    subtotal: number
  }>
  subtotal: number
  taxAmount: number
  total: number
  note?: string
  isReissue: boolean
  issueDate: Date
  invoiceNumber: string
}

// API レスポンス
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

// ページネーション
export interface PaginationParams {
  page: number
  limit: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 検索・フィルター
export interface SeminarSearchParams {
  keyword?: string
  category?: string
  tags?: string[]
  format?: 'OFFLINE' | 'ONLINE' | 'HYBRID'
  venue?: string
  dateFrom?: string
  dateTo?: string
  status?: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
}

export interface OrderSearchParams {
  keyword?: string // email, name, orderNumber
  sessionId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
}

// 統計データ
export interface DashboardStats {
  totalSeminars: number
  totalSessions: number
  totalOrders: number
  totalRevenue: number
  todayOrders: number
  todayRevenue: number
  upcomingSessions: SessionWithDetails[]
  recentOrders: OrderWithDetails[]
  paymentMethodBreakdown: Array<{
    method: string
    count: number
    amount: number
  }>
}
