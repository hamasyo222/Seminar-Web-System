import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { autoRegisterParticipant } from '@/lib/zoom'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const registerSchema = z.object({
  participantId: z.string(),
  sessionId: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await req.json()
    const validationResult = registerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'バリデーションエラー',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { participantId, sessionId } = validationResult.data

    // 参加者の存在確認
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        order: {
          include: {
            session: true
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, error: '参加者が見つかりません' },
        { status: 404 }
      )
    }

    if (participant.order.sessionId !== sessionId) {
      return NextResponse.json(
        { success: false, error: 'セッションIDが一致しません' },
        { status: 400 }
      )
    }

    if (participant.order.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: '支払いが完了していません' },
        { status: 400 }
      )
    }

    // Zoom登録処理
    await autoRegisterParticipant(participantId, sessionId)

    logger.audit('ZOOM_MANUAL_REGISTRATION', user.id, {
      participantId,
      sessionId
    })

    return NextResponse.json({
      success: true,
      message: 'Zoom登録が完了しました'
    })
  } catch (error) {
    logger.error('Error in manual Zoom registration', error)
    return NextResponse.json(
      { success: false, error: 'Zoom登録に失敗しました' },
      { status: 500 }
    )
  }
}
