import { prisma } from '../prisma'
import { sendEmail, EMAIL_TEMPLATES } from '../mail'
import { generateICS, encodeICSToBase64, generateICSFileName } from '../ics'
import { generateInvoicePDF, encodePDFToBase64 } from '../pdf'
import { formatJST, formatDateRange } from '../date'
import { formatCurrency, generateInvoiceNumber, getPaymentMethod } from '@/utils'
import { logger } from '../logger'
import type { OrderWithDetails, InvoiceData } from '@/types'

// 支払完了メール送信
export async function sendPaymentCompletedEmail(order: OrderWithDetails) {
  try {
    // 領収書生成
    const invoiceData: InvoiceData = {
      order,
      issuerName: process.env.INVOICE_ISSUER_NAME!,
      issuerTaxId: process.env.INVOICE_ISSUER_TAX_ID!,
      issuerAddress: process.env.INVOICE_ISSUER_ADDRESS!,
      issuerTel: process.env.INVOICE_ISSUER_TEL!,
      recipientName: order.invoiceCompanyName || order.name,
      recipientInfo: [
        order.invoiceDepartment,
        order.invoiceTitle,
        order.invoiceHonorific
      ].filter(Boolean).join(' '),
      items: order.orderItems.map(item => ({
        name: `${order.session.seminar.title} - ${item.ticketType.name}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.ticketType.taxRate,
        subtotal: item.subtotal
      })),
      subtotal: order.subtotal,
      taxAmount: order.tax,
      total: order.total,
      note: order.invoiceNote || 'セミナー受講料として',
      isReissue: false,
      issueDate: new Date(),
      invoiceNumber: generateInvoiceNumber()
    }

    const invoicePdf = await generateInvoicePDF(invoiceData)

    // 各参加者にメール送信
    for (const participant of order.participants) {
      // ICS生成
      const icsContent = await generateICS({
        session: order.session,
        participantName: participant.name,
        participantEmail: participant.email,
        orderNumber: order.orderNumber,
        joinUrl: participant.zoomRegistrations?.find(
          zr => zr.status === 'REGISTERED'
        )?.joinUrl
      })

      // メール送信
      await sendEmail({
        to: [participant.email],
        templateCode: EMAIL_TEMPLATES.PAYMENT_COMPLETED,
        variables: {
          participant_name: participant.name,
          seminar_title: order.session.seminar.title,
          order_number: order.orderNumber,
          payment_amount: formatCurrency(order.total),
          payment_method: getPaymentMethod(order.paymentMethod!),
          payment_date: formatJST(new Date()),
          session_date: formatDateRange(order.session.startAt, order.session.endAt),
          venue: order.session.venue || 'オンライン',
          zoom_join_url: participant.zoomRegistrations?.find(
            zr => zr.status === 'REGISTERED'
          )?.joinUrl || ''
        },
        attachments: [
          {
            filename: generateICSFileName(order.session.seminar.title, order.session.startAt),
            content: encodeICSToBase64(icsContent),
            type: 'text/calendar'
          },
          {
            filename: `invoice_${order.orderNumber}.pdf`,
            content: encodePDFToBase64(invoicePdf),
            type: 'application/pdf'
          }
        ]
      })

      logger.info('Payment completed email sent', {
        orderId: order.id,
        participantId: participant.id,
        email: participant.email
      })
    }

    // 領収書情報を保存
    await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: invoiceData.invoiceNumber,
        issuedAt: new Date()
      }
    })

  } catch (error) {
    logger.error('Failed to send payment completed email', error, { orderId: order.id })
    throw error
  }
}

// 受付確認メール送信
export async function sendRegistrationConfirmedEmail(order: OrderWithDetails) {
  try {
    // 申込者にメール送信
    await sendEmail({
      to: [order.email],
      templateCode: EMAIL_TEMPLATES.REGISTRATION_CONFIRMED,
      variables: {
        participant_name: order.name,
        seminar_title: order.session.seminar.title,
        order_number: order.orderNumber,
        session_date: formatDateRange(order.session.startAt, order.session.endAt),
        venue: order.session.venue || 'オンライン',
        participant_count: order.participants.length,
        total_amount: formatCurrency(order.total),
        payment_status: order.paymentMethod === 'CREDIT_CARD' 
          ? 'クレジットカード決済をお選びいただきました' 
          : `${getPaymentMethod(order.paymentMethod!)}でのお支払いをお待ちしております`,
        zoom_join_url: ''
      }
    })

    logger.info('Registration confirmed email sent', {
      orderId: order.id,
      email: order.email
    })
  } catch (error) {
    logger.error('Failed to send registration confirmed email', error, { orderId: order.id })
    throw error
  }
}

// 返金完了メール送信
export async function sendRefundCompletedEmail(order: OrderWithDetails, refundAmount: number) {
  try {
    await sendEmail({
      to: [order.email],
      subject: `【返金完了】${order.session.seminar.title}`,
      htmlContent: `
<p>${order.name} 様</p>

<p>「${order.session.seminar.title}」の返金処理が完了しました。</p>

<h3>■ 返金内容</h3>
<ul>
  <li>注文番号: ${order.orderNumber}</li>
  <li>返金金額: ${formatCurrency(refundAmount)}</li>
  <li>返金方法: ${getPaymentMethod(order.paymentMethod!)}</li>
</ul>

<p>返金の反映には、お支払い方法により数日かかる場合があります。</p>

<p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
      `,
      textContent: `
${order.name} 様

「${order.session.seminar.title}」の返金処理が完了しました。

■ 返金内容
・注文番号: ${order.orderNumber}
・返金金額: ${formatCurrency(refundAmount)}
・返金方法: ${getPaymentMethod(order.paymentMethod!)}

返金の反映には、お支払い方法により数日かかる場合があります。

ご不明な点がございましたら、お気軽にお問い合わせください。
      `
    })

    logger.info('Refund completed email sent', {
      orderId: order.id,
      email: order.email,
      refundAmount
    })
  } catch (error) {
    logger.error('Failed to send refund completed email', error, { orderId: order.id })
    throw error
  }
}

// コンビニ決済案内メール送信
export async function sendPaymentInstructionEmail(order: OrderWithDetails, paymentData: any) {
  try {
    const convenienceStoreInfo = paymentData.payment_details?.store || {}
    
    await sendEmail({
      to: [order.email],
      templateCode: EMAIL_TEMPLATES.PAYMENT_INSTRUCTION,
      variables: {
        participant_name: order.name,
        seminar_title: order.session.seminar.title,
        order_number: order.orderNumber,
        payment_amount: formatCurrency(order.total),
        payment_method: getPaymentMethod(order.paymentMethod!),
        payment_deadline: paymentData.payment_deadline ? formatJST(paymentData.payment_deadline) : '3日以内',
        convenience_store: convenienceStoreInfo.name || '',
        payment_code: convenienceStoreInfo.confirmation_code || paymentData.payment_details?.confirmation_code || '',
        receipt_number: convenienceStoreInfo.receipt || ''
      }
    })

    logger.info('Payment instruction email sent', {
      orderId: order.id,
      email: order.email,
      paymentMethod: order.paymentMethod
    })
  } catch (error) {
    logger.error('Failed to send payment instruction email', error, { orderId: order.id })
    throw error
  }
}
