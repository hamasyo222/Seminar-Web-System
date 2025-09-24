import { z } from 'zod'

export const sessionSchema = z.object({
  seminarId: z.string().min(1, 'セミナーIDは必須です'),
  title: z.string().optional().nullable(),
  startAt: z.string().min(1, '開始日時は必須です'),
  endAt: z.string().min(1, '終了日時は必須です'),
  format: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']),
  venue: z.string().optional().nullable(),
  venueAddress: z.string().optional().nullable(),
  onlineUrl: z.string().url('有効なURLを入力してください').optional().nullable().or(z.literal('')),
  zoomType: z.enum(['MEETING', 'WEBINAR']).optional().nullable(),
  zoomId: z.string().optional().nullable(),
  zoomPasscode: z.string().optional().nullable(),
  capacity: z.number().int().min(1, '定員は1名以上である必要があります'),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('SCHEDULED')
}).refine((data) => {
  if (!data.startAt || !data.endAt) return true
  const start = new Date(data.startAt)
  const end = new Date(data.endAt)
  return start < end
}, {
  message: '終了時刻は開始時刻より後である必要があります',
  path: ['endAt']
}).refine((data) => {
  if (data.format === 'OFFLINE' || data.format === 'HYBRID') {
    return !!data.venue
  }
  return true
}, {
  message: 'オフライン開催の場合、会場は必須です',
  path: ['venue']
})

