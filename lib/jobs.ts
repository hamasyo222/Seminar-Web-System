import cron from 'node-cron'
import { logger } from './logger'
import { sendReminder24h, sendReminder1h } from './jobs/reminders'
import { processUnpaidOrders } from './jobs/unpaid'
import { sendThankYouEmails } from './jobs/thankyou'

// ジョブのスケジュール定義
const jobs = [
  {
    name: 'reminder_24h',
    schedule: '0 10 * * *', // 毎日10:00に実行
    handler: sendReminder24h,
    description: '24時間前リマインダー送信'
  },
  {
    name: 'reminder_1h',
    schedule: '0 * * * *', // 毎時0分に実行
    handler: sendReminder1h,
    description: '1時間前リマインダー送信'
  },
  {
    name: 'unpaid_notice',
    schedule: '0 9,15 * * *', // 9:00と15:00に実行
    handler: processUnpaidOrders,
    description: '未入金催促・期限切れ処理'
  },
  {
    name: 'thank_you',
    schedule: '0 11 * * *', // 毎日11:00に実行
    handler: sendThankYouEmails,
    description: 'サンクスメール送信'
  }
]

// ジョブの初期化
export function initializeJobs() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true') {
    jobs.forEach(job => {
      cron.schedule(job.schedule, async () => {
        logger.info(`Starting job: ${job.name}`, { jobName: job.name })
        
        try {
          await job.handler()
          logger.info(`Job completed: ${job.name}`, { jobName: job.name })
        } catch (error) {
          logger.error(`Job failed: ${job.name}`, error, { jobName: job.name })
        }
      })

      logger.info(`Job scheduled: ${job.name}`, {
        jobName: job.name,
        schedule: job.schedule,
        description: job.description
      })
    })
  } else {
    logger.info('Jobs are disabled in development mode. Set ENABLE_JOBS=true to enable.')
  }
}

// 手動実行用
export async function runJob(jobName: string) {
  const job = jobs.find(j => j.name === jobName)
  
  if (!job) {
    throw new Error(`Job not found: ${jobName}`)
  }

  logger.info(`Manually running job: ${jobName}`, { jobName })
  
  try {
    await job.handler()
    logger.info(`Job completed: ${jobName}`, { jobName })
  } catch (error) {
    logger.error(`Job failed: ${jobName}`, error, { jobName })
    throw error
  }
}
