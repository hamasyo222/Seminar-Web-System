import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoicePDF } from '@/lib/pdf'
import { generateInvoiceNumber } from '@/utils'
import type { OrderWithDetails, InvoiceData } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const { orderId } = await context.params

    // 注文情報を取得
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
        invoices: {
          orderBy: {
            issuedAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    // 支払済みチェック
    if (order.status !== 'PAID') {
      return NextResponse.json(
        { error: '支払いが完了していません' },
        { status: 400 }
      )
    }

    // 既存の領収書情報を取得または新規作成
    let invoice = order.invoices[0]
    let invoiceNumber = invoice?.invoiceNumber

    if (!invoice) {
      // 新規作成
      invoiceNumber = generateInvoiceNumber()
      invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber,
          issuedAt: new Date(),
          isReissue: false,
          reissueCount: 0
        }
      })
    } else {
      // 再発行
      invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber,
          issuedAt: new Date(),
          isReissue: true,
          reissueCount: invoice.reissueCount + 1
        }
      })
    }

    // 領収書データ準備
    const invoiceData: InvoiceData = {
      order: order as OrderWithDetails,
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
      isReissue: invoice.isReissue,
      issueDate: invoice.issuedAt,
      invoiceNumber: invoice.invoiceNumber
    }

    // PDF生成
    const pdfBuffer = await generateInvoicePDF(invoiceData)

    // レスポンス
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${order.orderNumber}.pdf"`,
      }
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: '領収書の生成に失敗しました' },
      { status: 500 }
    )
  }
}
