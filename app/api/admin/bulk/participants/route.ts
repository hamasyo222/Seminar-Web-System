import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, AuditAction, getAuditContext } from '@/lib/audit'
import { sendEmail } from '@/lib/mail'
import { generateCSV } from '@/lib/csv'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['check_in', 'send_email', 'export', 'update_status']),
  participantIds: z.array(z.string()).min(1, '参加者を選択してください'),
  params: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { action, participantIds, params } = bulkActionSchema.parse(body)

    // 権限チェック
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const context = getAuditContext(request, user)

    switch (action) {
      case 'check_in':
        return await handleCheckIn(participantIds, user, context)
      
      case 'send_email':
        return await handleSendEmail(participantIds, params, user, context)
      
      case 'export':
        return await handleExport(participantIds, user, context)
      
      case 'update_status':
        return await handleUpdateStatus(participantIds, params, user, context)
      
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: '一括操作に失敗しました' },
      { status: 500 }
    )
  }
}

// 一括チェックイン
async function handleCheckIn(participantIds: string[], user: any, context: any) {
  const participants = await prisma.participant.findMany({
    where: { 
      id: { in: participantIds },
      attendanceStatus: { not: 'CHECKED_IN' }
    },
    include: {
      order: {
        include: {
          session: true
        }
      }
    }
  })

  const checkInLogs = []
  let successCount = 0

  for (const participant of participants) {
    try {
      // 参加者のステータスを更新
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          attendanceStatus: 'CHECKED_IN',
          checkedInAt: new Date()
        }
      })

      // チェックインログを作成
      const log = await prisma.checkInLog.create({
        data: {
          participantId: participant.id,
          sessionId: participant.order.sessionId,
          orderId: participant.orderId,
          action: 'CHECK_IN',
          checkedInBy: user.id
        }
      })

      checkInLogs.push(log)
      successCount++
    } catch (error) {
      console.error('Check-in error:', error)
    }
  }

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.PARTICIPANT_CHECKIN,
      entityType: 'Participant',
      metadata: {
        participantIds,
        successCount,
        method: 'bulk'
      },
      description: `一括チェックイン (${successCount}/${participants.length}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      checkedIn: successCount,
      failed: participants.length - successCount
    }
  })
}

// 一括メール送信
async function handleSendEmail(participantIds: string[], params: any, user: any, context: any) {
  const { emailType, templateId, subject, message } = params

  const participants = await prisma.participant.findMany({
    where: { id: { in: participantIds } },
    include: {
      order: {
        include: {
          session: {
            include: { seminar: true }
          }
        }
      }
    }
  })

  let successCount = 0
  let errorCount = 0

  for (const participant of participants) {
    try {
      if (templateId) {
        // テンプレート使用
        await sendEmail({
          to: [participant.email],
          subject: 'セミナー関連のお知らせ',
          templateCode: templateId,
          variables: {
            participant_name: participant.name,
            seminar_title: participant.order.session.seminar.title,
            session_date: participant.order.session.startAt.toLocaleString('ja-JP'),
            order_number: participant.order.orderNumber
          }
        })
      } else {
        // カスタムメッセージ
        const processedMessage = message
          .replace(/{{name}}/g, participant.name)
          .replace(/{{seminar_title}}/g, participant.order.session.seminar.title)
          .replace(/{{session_date}}/g, participant.order.session.startAt.toLocaleString('ja-JP'))

        await sendEmail({
          to: [participant.email],
          subject: subject || `【お知らせ】${participant.order.session.seminar.title}`,
          htmlContent: `<p>${processedMessage.replace(/\n/g, '<br>')}</p>`,
          textContent: processedMessage
        })
      }
      
      successCount++
    } catch (error) {
      console.error('Email send error:', error)
      errorCount++
    }
  }

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.EMAIL_SEND,
      entityType: 'Participant',
      metadata: {
        participantIds,
        emailType,
        templateId,
        successCount,
        errorCount
      },
      description: `参加者へ一括メール送信 (成功: ${successCount}件, 失敗: ${errorCount}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      sent: successCount,
      failed: errorCount
    }
  })
}

// CSVエクスポート
async function handleExport(participantIds: string[], user: any, context: any) {
  const participants = await prisma.participant.findMany({
    where: { id: { in: participantIds } },
    include: {
      order: {
        include: {
          session: {
            include: { seminar: true }
          },
          orderItems: {
            include: { ticketType: true }
          }
        }
      },
    }
  })

  const headers = [
    '氏名',
    'フリガナ',
    'メールアドレス',
    '会社名',
    'セミナー名',
    '開催日',
    'チケット種別',
    '注文番号',
    '支払状況',
    '出席状況',
    'チェックイン日時',
    'チェックイン担当者'
  ]

  const rows = participants.map(participant => [
    participant.name,
    participant.nameKana || '',
    participant.email,
    participant.company || '',
    participant.order.session.seminar.title,
    participant.order.session.startAt.toISOString(),
    participant.order.orderItems[0]?.ticketType.name || '',
    participant.order.orderNumber,
    participant.order.status,
    participant.attendanceStatus,
    participant.checkedInAt ? participant.checkedInAt.toISOString() : '',
    participant.checkedInBy || ''
  ])

  const csvData = generateCSV(headers, rows)

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.DATA_EXPORT,
      entityType: 'Participant',
      metadata: {
        participantIds,
        count: participants.length
      },
      description: `参加者データをエクスポート (${participants.length}件)`
    },
    context
  )

  const encoder = new TextEncoder()
  const csvBuffer = encoder.encode(csvData)

  return new NextResponse(csvBuffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="participants-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

// ステータス一括更新
async function handleUpdateStatus(participantIds: string[], params: any, user: any, context: any) {
  const { status, reason } = params

  if (!['REGISTERED', 'CHECKED_IN', 'NO_SHOW', 'CANCELLED'].includes(status)) {
    return NextResponse.json(
      { error: '無効なステータスです' },
      { status: 400 }
    )
  }

  const updatedParticipants = await prisma.participant.updateMany({
    where: { id: { in: participantIds } },
    data: {
      attendanceStatus: status,
      checkedInAt: status === 'CHECKED_IN' ? new Date() : undefined
    }
  })

  // チェックインの場合はログも作成
  if (status === 'CHECKED_IN') {
    const participants = await prisma.participant.findMany({
      where: { id: { in: participantIds } },
      include: { order: true }
    })

    for (const participant of participants) {
      await prisma.checkInLog.create({
        data: {
          participantId: participant.id,
          orderId: participant.orderId,
          sessionId: participant.order.sessionId,
          action: 'CHECK_IN',
          checkedInBy: user.id
        }
      })
    }
  }

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.PARTICIPANT_UPDATE,
      entityType: 'Participant',
      metadata: {
        participantIds,
        newStatus: status,
        reason,
        count: updatedParticipants.count
      },
      description: `参加者ステータスを一括更新 (${updatedParticipants.count}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      updated: updatedParticipants.count
    }
  })
}
