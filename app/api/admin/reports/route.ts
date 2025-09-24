import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth()
    
    // VIEWER以外の権限が必要
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = new Date(searchParams.get('startDate') || new Date(new Date().setMonth(new Date().getMonth() - 3)))
    const endDate = new Date(searchParams.get('endDate') || new Date())

    // 売上データの取得
    const revenueData = await getRevenueData(startDate, endDate)
    
    // 参加者データの取得
    const participantsData = await getParticipantsData(startDate, endDate)
    
    // 満足度データの取得
    const satisfactionData = await getSatisfactionData(startDate, endDate)
    
    // 運営指標の取得
    const operationalData = await getOperationalData(startDate, endDate)

    return NextResponse.json({
      success: true,
      data: {
        revenue: revenueData,
        participants: participantsData,
        satisfaction: satisfactionData,
        operational: operationalData
      }
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { success: false, error: 'レポートの生成に失敗しました' },
      { status: 500 }
    )
  }
}

// 売上データ取得
async function getRevenueData(startDate: Date, endDate: Date) {
  // 月別売上
  const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; amount: number }>>`
    SELECT 
      strftime('%Y-%m', paid_at) as month,
      CAST(SUM(total) AS INT) as amount
    FROM orders
    WHERE status = 'PAID'
      AND paid_at >= ${startDate}
      AND paid_at <= ${endDate}
    GROUP BY strftime('%Y-%m', paid_at)
    ORDER BY month
  `

  // 支払方法別売上
  const paymentMethodRevenue = await prisma.$queryRaw<Array<{ method: string; amount: number; count: number }>>`
    SELECT 
      payment_method as method,
      CAST(SUM(total) AS INT) as amount,
      CAST(COUNT(*) AS INT) as count
    FROM orders
    WHERE status = 'PAID'
      AND paid_at >= ${startDate}
      AND paid_at <= ${endDate}
    GROUP BY payment_method
  `

  // トップセミナー
  const topSeminars = await prisma.$queryRaw<Array<{ title: string; revenue: number; participants: number }>>`
    SELECT 
      s.title,
      CAST(SUM(o.total) AS INT) as revenue,
      CAST(COUNT(DISTINCT p.id) AS INT) as participants
    FROM orders o
    JOIN sessions sess ON o.session_id = sess.id
    JOIN seminars s ON sess.seminar_id = s.id
    JOIN participants p ON p.order_id = o.id
    WHERE o.status = 'PAID'
      AND o.paid_at >= ${startDate}
      AND o.paid_at <= ${endDate}
    GROUP BY s.id, s.title
    ORDER BY revenue DESC
    LIMIT 5
  `

  return {
    monthly: monthlyRevenue.map(item => ({
      month: format(new Date(item.month + '-01'), 'yyyy年MM月'),
      amount: item.amount
    })),
    byPaymentMethod: paymentMethodRevenue.map(item => ({
      method: getPaymentMethodLabel(item.method),
      amount: item.amount,
      count: item.count
    })),
    topSeminars
  }
}

// 参加者データ取得
async function getParticipantsData(startDate: Date, endDate: Date) {
  // 月別参加者数
  const monthlyParticipants = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
    SELECT 
      strftime('%Y-%m', o.created_at) as month,
      CAST(COUNT(DISTINCT p.id) AS INT) as count
    FROM participants p
    JOIN orders o ON p.order_id = o.id
    WHERE o.status = 'PAID'
      AND o.created_at >= ${startDate}
      AND o.created_at <= ${endDate}
    GROUP BY strftime('%Y-%m', o.created_at)
    ORDER BY month
  `

  // セミナー別参加者
  const bySeminar = await prisma.$queryRaw<Array<{ seminar: string; count: number }>>`
    SELECT 
      s.title as seminar,
      CAST(COUNT(DISTINCT p.id) AS INT) as count
    FROM participants p
    JOIN orders o ON p.order_id = o.id
    JOIN sessions sess ON o.session_id = sess.id
    JOIN seminars s ON sess.seminar_id = s.id
    WHERE o.status = 'PAID'
      AND o.created_at >= ${startDate}
      AND o.created_at <= ${endDate}
    GROUP BY s.id, s.title
    ORDER BY count DESC
    LIMIT 10
  `

  // リテンション（簡易版）
  const uniqueEmails = await prisma.$queryRaw<Array<{ email: string; order_count: number }>>`
    SELECT 
      email,
      CAST(COUNT(*) AS INT) as order_count
    FROM orders
    WHERE status = 'PAID'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    GROUP BY email
  `

  const firstTime = uniqueEmails.filter(u => u.order_count === 1).length
  const repeat = uniqueEmails.filter(u => u.order_count > 1).length

  return {
    monthly: monthlyParticipants.map(item => ({
      month: format(new Date(item.month + '-01'), 'yyyy年MM月'),
      count: item.count
    })),
    bySeminar,
    retention: { firstTime, repeat }
  }
}

// 満足度データ取得
async function getSatisfactionData(startDate: Date, endDate: Date) {
  // 平均満足度
  const avgSatisfaction = await prisma.$queryRaw<Array<{ average: number }>>`
    SELECT AVG(rating) as average
    FROM surveys
    WHERE submitted_at >= ${startDate}
      AND submitted_at <= ${endDate}
  `

  // 満足度分布
  const distribution = await prisma.$queryRaw<Array<{ rating: number; count: number }>>`
    SELECT 
      rating,
      CAST(COUNT(*) AS INT) as count
    FROM surveys
    WHERE submitted_at >= ${startDate}
      AND submitted_at <= ${endDate}
    GROUP BY rating
    ORDER BY rating
  `

  // セッション別満足度
  const bySession = await prisma.$queryRaw<Array<{ session: string; average: number; count: number }>>`
    SELECT 
      s.title || ' - ' || strftime('%Y/%m/%d', sess.start_at) as session,
      AVG(sv.rating) as average,
      CAST(COUNT(*) AS INT) as count
    FROM surveys sv
    JOIN sessions sess ON sv.session_id = sess.id
    JOIN seminars s ON sess.seminar_id = s.id
    WHERE sv.submitted_at >= ${startDate}
      AND sv.submitted_at <= ${endDate}
    GROUP BY sess.id
    ORDER BY average DESC
    LIMIT 10
  `

  // 推奨率
  const recommendations = await prisma.$queryRaw<Array<{ would_recommend: boolean; count: number }>>`
    SELECT 
      would_recommend,
      CAST(COUNT(*) AS INT) as count
    FROM surveys
    WHERE submitted_at >= ${startDate}
      AND submitted_at <= ${endDate}
    GROUP BY would_recommend
  `

  const recommendCount = recommendations.find(r => r.would_recommend)?.count || 0
  const totalCount = recommendations.reduce((sum, r) => sum + r.count, 0)
  const recommendationRate = totalCount > 0 ? Math.round((recommendCount / totalCount) * 100) : 0

  return {
    average: avgSatisfaction[0]?.average || 0,
    distribution: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: distribution.find(d => d.rating === rating)?.count || 0
    })),
    bySession: bySession.map(item => ({
      session: item.session,
      average: Number(item.average.toFixed(1)),
      count: item.count
    })),
    recommendations: recommendationRate
  }
}

// 運営指標取得
async function getOperationalData(startDate: Date, endDate: Date) {
  // チェックイン率
  const checkInStats = await prisma.$queryRaw<Array<{ total: number; checked_in: number }>>`
    SELECT 
      CAST(COUNT(*) AS INT) as total,
      CAST(COUNT(CASE WHEN attendance_status = 'CHECKED_IN' THEN 1 END) AS INT) as checked_in
    FROM participants p
    JOIN orders o ON p.order_id = o.id
    JOIN sessions s ON o.session_id = s.id
    WHERE o.status = 'PAID'
      AND s.start_at >= ${startDate}
      AND s.start_at <= ${endDate}
      AND s.start_at < datetime('now')
  `

  const checkInRate = checkInStats[0]?.total > 0 
    ? Math.round((checkInStats[0].checked_in / checkInStats[0].total) * 100)
    : 0

  // キャンセル率
  const orderStats = await prisma.$queryRaw<Array<{ total: number; cancelled: number }>>`
    SELECT 
      CAST(COUNT(*) AS INT) as total,
      CAST(COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS INT) as cancelled
    FROM orders
    WHERE created_at >= ${startDate}
      AND created_at <= ${endDate}
  `

  const cancellationRate = orderStats[0]?.total > 0
    ? Math.round((orderStats[0].cancelled / orderStats[0].total) * 100)
    : 0

  // 返金率
  const refundStats = await prisma.$queryRaw<Array<{ total: number; refunded: number }>>`
    SELECT 
      CAST(COUNT(*) AS INT) as total,
      CAST(COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) AS INT) as refunded
    FROM orders
    WHERE status IN ('PAID', 'REFUNDED')
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
  `

  const refundRate = refundStats[0]?.total > 0
    ? Math.round((refundStats[0].refunded / refundStats[0].total) * 100)
    : 0

  // 平均注文額
  const avgOrderValue = await prisma.$queryRaw<Array<{ average: number }>>`
    SELECT AVG(total) as average
    FROM orders
    WHERE status = 'PAID'
      AND paid_at >= ${startDate}
      AND paid_at <= ${endDate}
  `

  return {
    checkInRate,
    cancellationRate,
    refundRate,
    averageOrderValue: Math.round(avgOrderValue[0]?.average || 0)
  }
}

// 支払方法のラベル取得
function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CREDIT_CARD: 'クレジットカード',
    KONBINI: 'コンビニ決済',
    PAYPAY: 'PayPay',
    BANK_TRANSFER: '銀行振込'
  }
  return labels[method] || method
}




