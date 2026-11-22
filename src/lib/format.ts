// 表示用のフォーマット
const yenFormatter = new Intl.NumberFormat('ja-JP')

/** 1234 → 「¥1,234」、-500 → 「-¥500」 */
export function formatYen(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}¥${yenFormatter.format(Math.abs(amount))}`
}
