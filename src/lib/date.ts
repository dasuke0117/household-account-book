// 日付まわりの関数。日付はすべて端末のローカル時間で扱う

/** Date を YYYY-MM-DD の文字列にする */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** YYYY-MM-DD から YYYY-MM（月のキー）を取り出す */
export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7)
}

/** YYYY-MM-DD の「日」の部分を数値で返す */
export function dayOf(dateKey: string): number {
  return Number(dateKey.slice(8, 10))
}

/** その月の日数（YYYY-MM） */
export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  // 翌月の0日目 = その月の最終日
  return new Date(y, m, 0).getDate()
}

/** 前の月のキー（YYYY-MM） */
export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const prev = new Date(y, m - 2, 1)
  return toDateKey(prev).slice(0, 7)
}

/** YYYY-MM-DD が正しい日付かどうか */
export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** 「11月23日（日）」のような表示用の文字列 */
export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const week = ['日', '月', '火', '水', '木', '金', '土'][new Date(y, m - 1, d).getDay()]
  return `${m}月${d}日（${week}）`
}

/** 「2026年11月」のような表示用の文字列 */
export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return `${y}年${m}月`
}
