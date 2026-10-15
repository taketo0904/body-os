const pad = (n: number) => String(n).padStart(2, '0')

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isDateStr(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return toDateStr(parseDate(s)) === s
}

export function todayStr(): string {
  return toDateStr(new Date())
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

export function diffDays(a: string, b: string): number {
  const ms = parseDate(a).getTime() - parseDate(b).getTime()
  return Math.round(ms / 86400000)
}

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function formatJa(s: string): string {
  const d = parseDate(s)
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`
}

export function shortMD(s: string): string {
  const d = parseDate(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** end を含む直近 n 日（古い順） */
export function lastNDays(end: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1))
}

/** 日付を含む週の月曜日 */
export function weekStart(s: string): string {
  const dow = parseDate(s).getDay()
  return addDays(s, -((dow + 6) % 7))
}
