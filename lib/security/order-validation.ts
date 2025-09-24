import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface OrderSecurityCheckParams {
  sessionId: string
  email: string
  ipAddress: string
  userAgent: string
  tickets: Array<{ ticketTypeId: string; quantity: number }>
}

export async function performOrderSecurityChecks(params: OrderSecurityCheckParams) {
  const errors: string[] = []

  // 1. セッションの存在と状態チェック
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      seminar: true,
      ticketTypes: true,
      _count: {
        select: { orders: true }
      }
    }
  })

  if (!session) {
    errors.push('指定されたセッションが存在しません')
    return { isValid: false, errors, session: null }
  }

  if (session.status !== 'SCHEDULED') {
    errors.push('このセッションは申込を受け付けていません')
  }

  if (new Date(session.startAt) <= new Date()) {
    errors.push('既に開始されたセッションには申込できません')
  }

  // 2. 在庫チェック
  const remainingCapacity = session.capacity - (session._count?.orders || 0)
  const requestedQuantity = params.tickets.reduce((sum, t) => sum + t.quantity, 0)

  if (remainingCapacity < requestedQuantity) {
    errors.push(`残席数が不足しています（残り${remainingCapacity}席）`)
  }

  // 3. チケット種別の妥当性チェック
  for (const ticket of params.tickets) {
    const ticketType = session.ticketTypes.find(t => t.id === ticket.ticketTypeId)
    
    if (!ticketType) {
      errors.push('無効なチケット種別が含まれています')
      continue
    }

    if (!ticketType.isActive) {
      errors.push(`${ticketType.name}は現在販売していません`)
    }

    if (ticket.quantity > ticketType.maxPerOrder) {
      errors.push(`${ticketType.name}は一度に${ticketType.maxPerOrder}枚までしか購入できません`)
    }

    if (ticketType.stock !== null && ticketType.stock < ticket.quantity) {
      errors.push(`${ticketType.name}の在庫が不足しています`)
    }
  }

  // 4. 重複申込チェック
  const existingOrder = await prisma.order.findFirst({
    where: {
      sessionId: params.sessionId,
      email: params.email,
      status: {
        in: ['PENDING', 'PAID']
      }
    }
  })

  if (existingOrder) {
    errors.push('このメールアドレスで既に申込済みです')
  }

  // 5. レート制限チェック（同一IPからの連続申込を防ぐ）
  const recentOrders = await prisma.order.count({
    where: {
      ipAddress: params.ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // 過去1時間
      }
    }
  })

  if (recentOrders >= 10) {
    errors.push('短時間に多数の申込がありました。しばらく時間をおいてからお試しください')
    
    logger.warn('Rate limit exceeded for orders', {
      ipAddress: params.ipAddress,
      count: recentOrders
    })
  }

  // 6. ブラックリストチェック
  const isBlacklisted = await checkBlacklist(params.email, params.ipAddress)
  if (isBlacklisted) {
    errors.push('申込を受け付けることができません')
    
    logger.warn('Blacklisted order attempt', {
      email: params.email,
      ipAddress: params.ipAddress
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    session
  }
}

async function checkBlacklist(email: string, ipAddress: string): Promise<boolean> {
  // メールドメインのブラックリスト
  const blacklistedDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    '10minutemail.com'
  ]

  const emailDomain = email.split('@')[1]?.toLowerCase()
  if (emailDomain && blacklistedDomains.includes(emailDomain)) {
    return true
  }

  // IPアドレスのブラックリスト（データベースから取得）
  const blacklistedIp = await prisma.$queryRaw`
    SELECT 1 FROM blacklisted_ips 
    WHERE ip_address = ${ipAddress}
    LIMIT 1
  `

  return Array.isArray(blacklistedIp) && blacklistedIp.length > 0
}

// 申込完了後の在庫更新
export async function updateTicketStock(
  tickets: Array<{ ticketTypeId: string; quantity: number }>
) {
  for (const ticket of tickets) {
    await prisma.ticketType.update({
      where: { id: ticket.ticketTypeId },
      data: {
        stock: {
          decrement: ticket.quantity
        }
      }
    })
  }
}

// キャンセル時の在庫復元
export async function restoreTicketStock(
  tickets: Array<{ ticketTypeId: string; quantity: number }>
) {
  for (const ticket of tickets) {
    await prisma.ticketType.update({
      where: { id: ticket.ticketTypeId },
      data: {
        stock: {
          increment: ticket.quantity
        }
      }
    })
  }
}

// 不審な申込パターンの検出
export async function detectSuspiciousOrderPattern(params: {
  email: string
  ipAddress: string
  userAgent: string
}) {
  const flags: string[] = []

  // 1. 短時間での複数申込
  const recentOrdersFromIp = await prisma.order.count({
    where: {
      ipAddress: params.ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000) // 過去10分
      }
    }
  })

  if (recentOrdersFromIp >= 3) {
    flags.push('SHORT_TIME_MULTIPLE_ORDERS')
  }

  // 2. 同一IPから異なるメールアドレスでの申込
  const differentEmails = await prisma.order.findMany({
    where: {
      ipAddress: params.ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 過去24時間
      }
    },
    select: {
      email: true
    },
    distinct: ['email']
  })

  if (differentEmails.length >= 5) {
    flags.push('MULTIPLE_EMAILS_SAME_IP')
  }

  // 3. 不審なUser-Agent
  const suspiciousAgents = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'
  ]

  const userAgentLower = params.userAgent.toLowerCase()
  if (suspiciousAgents.some(agent => userAgentLower.includes(agent))) {
    flags.push('SUSPICIOUS_USER_AGENT')
  }

  // 4. 使い捨てメールアドレスの可能性
  const disposableEmailPatterns = [
    /\+\d+@/, // example+123@gmail.com
    /\d{10,}@/, // 1234567890@example.com
    /temp.*@/,
    /test.*@/,
    /fake.*@/
  ]

  if (disposableEmailPatterns.some(pattern => pattern.test(params.email))) {
    flags.push('POSSIBLE_DISPOSABLE_EMAIL')
  }

  if (flags.length > 0) {
    logger.warn('Suspicious order pattern detected', {
      email: params.email,
      ipAddress: params.ipAddress,
      flags
    })
  }

  return {
    isSuspicious: flags.length >= 2,
    flags
  }
}
