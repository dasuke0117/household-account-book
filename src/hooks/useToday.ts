// 「今日」の日付（YYYY-MM-DD）。アプリを開いたまま日付が変わっても追いかける
import { useEffect, useState } from 'react'
import { toDateKey } from '../lib/date'

export function useToday(): string {
  const [today, setToday] = useState(() => toDateKey(new Date()))

  useEffect(() => {
    const update = () => setToday(toDateKey(new Date()))
    // ホーム画面のアプリは閉じずに裏に置かれることが多いので、表に戻ったときにも確認する
    document.addEventListener('visibilitychange', update)
    const timer = window.setInterval(update, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', update)
      window.clearInterval(timer)
    }
  }, [])

  return today
}
