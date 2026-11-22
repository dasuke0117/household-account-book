import { describe, expect, it } from 'vitest'
import {
  calcMonthSummary,
  compareWithLastMonth,
  sortNewestFirst,
  totalsByCategory,
  wastefulExpenses,
} from './budget'
import type { Category, Expense, Rating } from './types'

let seq = 0
/** テスト用の支出を作る */
function expense(
  date: string,
  amount: number,
  category: Category = '食費',
  rating: Rating = '必要',
  createdAt = 0,
): Expense {
  seq += 1
  return { id: `e${seq}`, amount, category, rating, date, createdAt }
}

describe('calcMonthSummary（今月の数字）', () => {
  it('予算から固定費を先に引いて「自由に使えるお金」と「あと使える金額」を出す', () => {
    const expenses = [
      expense('2026-11-01', 60000, 'ローン'),
      expense('2026-11-05', 8000, '通信費'),
      expense('2026-11-10', 3000, '食費'),
      expense('2026-11-12', 2000, '外食費', '無駄'),
    ]
    const s = calcMonthSummary(expenses, 150000, '2026-11-20')
    expect(s.fixedTotal).toBe(68000)
    expect(s.freeMoney).toBe(82000)
    expect(s.variableSpent).toBe(5000)
    expect(s.remaining).toBe(77000)
  })

  it('ほかの月の支出は含めない', () => {
    const expenses = [expense('2026-10-31', 9999), expense('2026-12-01', 9999)]
    const s = calcMonthSummary(expenses, 100000, '2026-11-15')
    expect(s.variableSpent).toBe(0)
    expect(s.remaining).toBe(100000)
  })

  it('残り日数は今日を含めて数える', () => {
    expect(calcMonthSummary([], 30000, '2026-11-01').daysLeft).toBe(30)
    expect(calcMonthSummary([], 30000, '2026-11-30').daysLeft).toBe(1)
    expect(calcMonthSummary([], 30000, '2028-02-29').daysLeft).toBe(1) // うるう年
  })

  it('今日使っていい金額は「残り ÷ 残り日数」（今日まだ使っていないとき）', () => {
    // 11/21 は残り10日。30000 ÷ 10 = 3000
    const s = calcMonthSummary([], 30000, '2026-11-21')
    expect(s.todayAllowance).toBe(3000)
  })

  it('今日使った分は、今日使っていい金額からそのまま引く', () => {
    const expenses = [expense('2026-11-21', 1200, '食費')]
    const s = calcMonthSummary(expenses, 30000, '2026-11-21')
    expect(s.spentToday).toBe(1200)
    expect(s.todayAllowance).toBe(1800)
    expect(s.remaining).toBe(28800)
  })

  it('昨日までの支出は、残り日数で割る前に引く', () => {
    const expenses = [expense('2026-11-20', 10000, '食費')]
    // (30000 - 10000) ÷ 10日 = 2000
    expect(calcMonthSummary(expenses, 30000, '2026-11-21').todayAllowance).toBe(2000)
  })

  it('割り切れないときは切り捨てる', () => {
    // 10000 ÷ 3日 = 3333.33…
    expect(calcMonthSummary([], 10000, '2026-11-28').todayAllowance).toBe(3333)
  })

  it('今日の固定費は「今日使っていい金額」から引かない（固定費は自由に使えるお金から引く）', () => {
    const expenses = [expense('2026-11-21', 5000, 'サブスク')]
    const s = calcMonthSummary(expenses, 35000, '2026-11-21')
    expect(s.spentToday).toBe(0)
    expect(s.todayAllowance).toBe(3000) // (35000 - 5000) ÷ 10
  })

  it('使いすぎるとマイナスになる', () => {
    const expenses = [expense('2026-11-10', 40000, '趣味', '無駄')]
    const s = calcMonthSummary(expenses, 30000, '2026-11-21')
    expect(s.remaining).toBe(-10000)
    expect(s.todayAllowance).toBe(-1000)
  })

  it('予算が未設定（0）でも計算できる', () => {
    const s = calcMonthSummary([expense('2026-11-21', 500)], 0, '2026-11-21')
    expect(s.remaining).toBe(-500)
  })

  it('「無駄」「微妙」の合計は固定費も含めて出す', () => {
    const expenses = [
      expense('2026-11-01', 1000, '外食費', '無駄'),
      expense('2026-11-02', 980, 'サブスク', '無駄'),
      expense('2026-11-03', 500, '趣味', '微妙'),
      expense('2026-11-04', 300, '食費', '必要'),
      expense('2026-10-30', 9999, '趣味', '無駄'), // 先月
    ]
    const s = calcMonthSummary(expenses, 100000, '2026-11-21')
    expect(s.wasteTotal).toBe(1980)
    expect(s.questionableTotal).toBe(500)
  })
})

describe('compareWithLastMonth（先月比較）', () => {
  it('先月の同じ日までと比べる', () => {
    const expenses = [
      expense('2026-11-05', 1000, '外食費', '無駄'),
      expense('2026-11-06', 400, '趣味', '微妙'),
      expense('2026-10-05', 3000, '外食費', '無駄'),
      expense('2026-10-10', 200, '趣味', '微妙'),
      expense('2026-10-11', 5000, '外食費', '無駄'), // 先月の11日は比べる範囲の外
    ]
    const c = compareWithLastMonth(expenses, '2026-11-10')
    expect(c.current).toEqual({ waste: 1000, questionable: 400 })
    expect(c.previous).toEqual({ waste: 3000, questionable: 200 })
    expect(c.previousUntilDay).toBe(10)
  })

  it('先月にその日がないときは、先月の最終日まで', () => {
    expect(compareWithLastMonth([], '2026-03-30').previousUntilDay).toBe(28)
  })

  it('今日が月末なら、先月も最終日まで比べる', () => {
    // 2月28日（月末）→ 1月は31日まで
    expect(compareWithLastMonth([], '2026-02-28').previousUntilDay).toBe(31)
    // 11月30日（月末）→ 10月は31日まで
    expect(compareWithLastMonth([], '2026-11-30').previousUntilDay).toBe(31)
  })

  it('先月の記録があるかどうかが分かる（比べる範囲の外の記録でもよい）', () => {
    expect(compareWithLastMonth([], '2026-11-10').hasPreviousRecords).toBe(false)
    const expenses = [expense('2026-10-25', 100, '食費', '必要')]
    expect(compareWithLastMonth(expenses, '2026-11-10').hasPreviousRecords).toBe(true)
  })

  it('1月は前の年の12月と比べる', () => {
    const expenses = [expense('2025-12-03', 700, '趣味', '無駄')]
    const c = compareWithLastMonth(expenses, '2026-01-15')
    expect(c.previous.waste).toBe(700)
  })
})

describe('一覧用の関数', () => {
  it('新しい順に並べる（同じ日なら記録が新しい順）', () => {
    const a = expense('2026-11-01', 1, '食費', '必要', 100)
    const b = expense('2026-11-03', 1, '食費', '必要', 50)
    const c = expense('2026-11-03', 1, '食費', '必要', 200)
    expect(sortNewestFirst([a, b, c]).map((e) => e.id)).toEqual([c.id, b.id, a.id])
  })

  it('今月の「無駄」「微妙」だけを新しい順に出す', () => {
    const a = expense('2026-11-01', 100, '外食費', '無駄')
    const b = expense('2026-11-02', 100, '食費', '必要')
    const c = expense('2026-11-03', 100, '趣味', '微妙')
    const d = expense('2026-10-31', 100, '趣味', '無駄')
    expect(wastefulExpenses([a, b, c, d], '2026-11').map((e) => e.id)).toEqual([c.id, a.id])
  })

  it('カテゴリ別の合計を金額の大きい順に出す', () => {
    const expenses = [
      expense('2026-11-01', 300, '趣味'),
      expense('2026-11-02', 1000, '外食費'),
      expense('2026-11-03', 800, '趣味'),
    ]
    expect(totalsByCategory(expenses)).toEqual([
      { category: '趣味', total: 1100 },
      { category: '外食費', total: 1000 },
    ])
  })
})
