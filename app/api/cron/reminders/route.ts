import { NextRequest, NextResponse } from 'next/server'
import { runJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  // Cron実行の認証（Vercel Cronの場合はVERCEL_CRON_SECRET）
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'dev-secret'
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || '24h'

  try {
    const jobName = type === '1h' ? 'reminder_1h' : 'reminder_24h'
    const result = await runJob(jobName)
    
    return NextResponse.json({ success: true, result })
  } catch (error) {
    logger.error('Cron job failed', error)
    return NextResponse.json({ error: 'Job failed' }, { status: 500 })
  }
}
