import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ja'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('ja')

// 常にAsia/Tokyoで処理
const TIMEZONE = 'Asia/Tokyo'

export function toJST(date: Date | string | null | undefined): dayjs.Dayjs | null {
  if (!date) return null
  return dayjs(date).tz(TIMEZONE)
}

export function formatJST(date: Date | string | null | undefined, format = 'YYYY/MM/DD HH:mm'): string {
  const jstDate = toJST(date)
  return jstDate ? jstDate.format(format) : ''
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const startJST = toJST(start)!
  const endJST = toJST(end)!
  
  if (startJST.isSame(endJST, 'day')) {
    // 同日の場合
    return `${startJST.format('YYYY/MM/DD(ddd)')} ${startJST.format('HH:mm')}〜${endJST.format('HH:mm')}`
  } else {
    // 複数日の場合
    return `${startJST.format('YYYY/MM/DD(ddd) HH:mm')}〜${endJST.format('MM/DD(ddd) HH:mm')}`
  }
}

export function getJSTNow(): dayjs.Dayjs {
  return dayjs().tz(TIMEZONE)
}

export function fromJSTString(dateString: string): Date {
  return dayjs.tz(dateString, TIMEZONE).toDate()
}

export function getDaysUntil(date: Date | string): number {
  const target = toJST(date)!
  const now = getJSTNow()
  return target.diff(now, 'day')
}

export function getHoursUntil(date: Date | string): number {
  const target = toJST(date)!
  const now = getJSTNow()
  return target.diff(now, 'hour')
}

export function isWithinHours(date: Date | string, hours: number): boolean {
  return getHoursUntil(date) <= hours && getHoursUntil(date) > 0
}
