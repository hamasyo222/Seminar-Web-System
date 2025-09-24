import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaginationParams, getPaginationMeta, successResponse, handleApiError } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit, orderBy, order } = getPaginationParams(searchParams)
    
    // フィルター条件
    const status = searchParams.get('status')
    const format = searchParams.get('format')
    const seminarId = searchParams.get('seminar_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (format) {
      where.format = format
    }
    
    if (seminarId) {
      where.seminarId = seminarId
    }
    
    if (dateFrom || dateTo) {
      where.startAt = {}
      if (dateFrom) {
        where.startAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.startAt.lte = new Date(dateTo)
      }
    }

    // データ取得
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          seminar: true,
          ticketTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { [orderBy as string]: order },
        skip: ((page || 1) - 1) * (limit || 10),
        take: limit || 10
      }),
      prisma.session.count({ where })
    ])

    const meta = getPaginationMeta(total, page || 1, limit || 10)

    return successResponse(sessions, undefined, meta)
  } catch (error) {
    return handleApiError(error)
  }
}
