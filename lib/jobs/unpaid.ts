import { prisma } from '../prisma'
import { sendEmail } from '../mail'
import { formatJST } from '../date'
import { logger } from '../logger'
import { formatCurrency, getPaymentMethod } from '@/utils'

// 未入金注文の処理
export async function processUnpaidOrders() {
  const startTime = logger.startTimer('unpaid_orders')

  try {
    let processedCount = 0
    let expiredCount = 0
    let noticeCount = 0

    // 1. コンビニ決済の期限切れチェック（通常3日）
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: 'KONBINI',
        createdAt: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3日前
        }
      },
      include: {
        session: {
          include: {
            seminar: true
          }
        }
      }
    })

    logger.info(`Found ${expiredOrders.length} expired orders`)

    for (const order of expiredOrders) {
      try {
        // 注文を期限切れに更新
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'EXPIRED',
            cancelledAt: new Date()
          }
        })

        // TODO: 在庫を戻す処理

        logger.info(`Order expired`, { orderId: order.id, orderNumber: order.orderNumber })
        expiredCount++
      } catch (error) {
        logger.error('Failed to expire order', error, { orderId: order.id })
      }
    }

    // 2. 未入金催促メール（1日後と2日後）
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: {
          in: ['KONBINI', 'BANK_TRANSFER']
        },
        createdAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3日以内
          lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)   // 1日以上前
        }
      },
      include: {
        session: {
          include: {
            seminar: true
          }
        },
        payments: {
          where: {
            status: 'AUTHORIZED'
          }
        }
      }
    })

    logger.info(`Found ${unpaidOrders.length} unpaid orders for notice`)

    for (const order of unpaidOrders) {
      try {
        const daysSinceOrder = Math.floor(
          (Date.now() - order.createdAt.getTime()) / (24 * 60 * 60 * 1000)
        )

        // 1日後と2日後に送信
        if (daysSinceOrder === 1 || daysSinceOrder === 2) {
          const payment = order.payments[0]
          const daysRemaining = 3 - daysSinceOrder

          // 催促メール送信
          await sendEmail({
            to: [order.email],
            subject: `【リマインダー】お支払いをお待ちしております - ${order.session.seminar.title}`,
            htmlContent: `
<p>${order.name} 様</p>

<p>この度は「${order.session.seminar.title}」にお申込みいただき、誠にありがとうございます。</p>

<p>お支払いがまだ完了しておりません。以下の内容でお支払いをお願いいたします。</p>

<h3>■ お支払い情報</h3>
<ul>
  <li>注文番号: ${order.orderNumber}</li>
  <li>金額: ${formatCurrency(order.total)}</li>
  <li>支払方法: ${getPaymentMethod(order.paymentMethod!)}</li>
  <li>支払期限: あと${daysRemaining}日</li>
</ul>

${payment?.metadata ? `
<h3>■ ${order.paymentMethod === 'KONBINI' ? 'コンビニ払込情報' : '振込先情報'}</h3>
<p>${JSON.stringify(payment.metadata)}</p>
` : ''}

<p>期限内にお支払いいただけない場合、お申込みは自動的にキャンセルとなります。</p>

<p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            `,
            textContent: `
${order.name} 様

この度は「${order.session.seminar.title}」にお申込みいただき、誠にありがとうございます。

お支払いがまだ完了しておりません。以下の内容でお支払いをお願いいたします。

■ お支払い情報
・注文番号: ${order.orderNumber}
・金額: ${formatCurrency(order.total)}
・支払方法: ${getPaymentMethod(order.paymentMethod!)}
・支払期限: あと${daysRemaining}日

期限内にお支払いいただけない場合、お申込みは自動的にキャンセルとなります。

ご不明な点がございましたら、お気軽にお問い合わせください。
            `
          })

          logger.info(`Unpaid notice sent`, { 
            orderId: order.id, 
            orderNumber: order.orderNumber,
            daysSinceOrder 
          })
          noticeCount++
        }
      } catch (error) {
        logger.error('Failed to send unpaid notice', error, { orderId: order.id })
      }
    }

    processedCount = expiredCount + noticeCount

    // ジョブログ記録
    await prisma.jobLog.create({
      data: {
        jobName: 'unpaid_orders',
        status: 'COMPLETED',
        completedAt: new Date(),
        processedCount,
        errorCount: 0,
        details: {
          expiredOrders: expiredCount,
          noticesSent: noticeCount
        }
      }
    })

    startTime()
    
    return {
      success: true,
      expiredCount,
      noticeCount
    }
  } catch (error) {
    await prisma.jobLog.create({
      data: {
        jobName: 'unpaid_orders',
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }
    })

    throw error
  }
}
