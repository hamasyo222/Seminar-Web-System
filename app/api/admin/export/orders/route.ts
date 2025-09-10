import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateOrdersCSV } from '@/lib/csv'
import { logger } from '@/lib/logger'
import type { OrderWithDetails } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    
    // VIEWERは除外
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const sessionId = searchParams.get('sessionId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // クエリ条件構築
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (sessionId) {
      where.sessionId = sessionId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // 注文データ取得
    const orders = await prisma.order.findMany({
      where,
      include: {
        session: {
          include: {
            seminar: true
          }
        },
        orderItems: {
          include: {
            ticketType: true
          }
        },
        participants: true,
        payments: true,
        refunds: true,
        invoices: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    logger.audit('EXPORT_ORDERS', user.id, {
      count: orders.length,
      filters: { status, sessionId, dateFrom, dateTo }
    })

    // CSV生成
    const csv = generateOrdersCSV(orders as OrderWithDetails[])
    const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`

    // レスポンス
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (error) {
    logger.error('Error exporting orders', error)
    return NextResponse.json(
      { error: 'エクスポートに失敗しました' },
      { status: 500 }
    )
  }
}
