// お金の計算ロジック（画面から切り離して、テストできるようにしている）
import { dayOf, daysInMonth, monthKeyOf, previousMonthKey } from './date'
import { isFixedCategory, type Category, type Expense, type Rating } from './types'

function sum(expenses: readonly Expense[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0)
}

function sumByRating(expenses: readonly Expense[], rating: Rating): number {
  return sum(expenses.filter((e) => e.rating === rating))
}

/** 指定した月（YYYY-MM）の支出だけを取り出す */
export function expensesInMonth(expenses: readonly Expense[], monthKey: string): Expense[] {
  return expenses.filter((e) => monthKeyOf(e.date) === monthKey)
}

/** 新しい順（日付が新しい順、同じ日なら記録が新しい順）に並べる */
export function sortNewestFirst(expenses: readonly Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return b.createdAt - a.createdAt
  })
}

/** ホーム画面に出す今月の数字 */
export interface MonthSummary {
  /** 月の予算 */
  budget: number
  /** 今月記録した固定費の合計 */
  fixedTotal: number
  /** 自由に使えるお金（予算 − 固定費） */
  freeMoney: number
  /** 今月の固定費以外の支出の合計 */
  variableSpent: number
  /** 今月あと使える金額（自由に使えるお金 − 固定費以外の支出）。使いすぎるとマイナス */
  remaining: number
  /** 今日を含めた今月の残り日数 */
  daysLeft: number
  /** 今日の固定費以外の支出 */
  spentToday: number
  /** 今日あと使っていい金額。使いすぎるとマイナス */
  todayAllowance: number
  /** 今月「無駄」にした支出の合計（固定費も含む） */
  wasteTotal: number
  /** 今月「微妙」にした支出の合計（固定費も含む） */
  questionableTotal: number
}

/**
 * 今月の数字を計算する
 *
 * - 「あと使える金額」は、予算から今月の固定費を先に引いた「自由に使えるお金」を基準にする。
 * - 「今日使っていい金額」は、今日の朝の時点の残り ÷ 今日を含めた残り日数 から、
 *   今日すでに使った分を引いたもの。今日使うほど、その分だけ減る。
 */
export function calcMonthSummary(
  expenses: readonly Expense[],
  budget: number,
  todayKey: string,
): MonthSummary {
  const monthKey = monthKeyOf(todayKey)
  const thisMonth = expensesInMonth(expenses, monthKey)

  const fixed = thisMonth.filter((e) => isFixedCategory(e.category))
  const variable = thisMonth.filter((e) => !isFixedCategory(e.category))

  const fixedTotal = sum(fixed)
  const freeMoney = budget - fixedTotal
  const variableSpent = sum(variable)
  const remaining = freeMoney - variableSpent

  const daysLeft = daysInMonth(monthKey) - dayOf(todayKey) + 1
  const spentToday = sum(variable.filter((e) => e.date === todayKey))
  // 今日より前の支出だけを引いた「今日の朝の時点の残り」
  const remainingAtStartOfToday = remaining + spentToday
  const todayAllowance = Math.floor(remainingAtStartOfToday / daysLeft) - spentToday

  return {
    budget,
    fixedTotal,
    freeMoney,
    variableSpent,
    remaining,
    daysLeft,
    spentToday,
    todayAllowance,
    wasteTotal: sumByRating(thisMonth, '無駄'),
    questionableTotal: sumByRating(thisMonth, '微妙'),
  }
}

/** 「無駄」「微妙」の合計 */
export interface WasteTotals {
  waste: number
  questionable: number
}

/** 先月との比較 */
export interface MonthComparison {
  /** 今月（1日〜今日まで） */
  current: WasteTotals
  /** 先月（1日〜先月の同じ日まで） */
  previous: WasteTotals
  /** 先月の何日までと比べたか */
  previousUntilDay: number
  /** 先月の記録が1件でもあるか（使い始めの月は false） */
  hasPreviousRecords: boolean
}

/**
 * 今月と先月の「無駄」「微妙」の合計を比べる
 *
 * 月の途中で先月まるごとと比べると不公平なので、先月の同じ日までと比べる。
 * - 先月にその日がない場合（3月31日 → 2月）は先月の最終日まで。
 * - 今日が月末なら、先月も最終日まで（月まるごと同士）で比べる。
 */
export function compareWithLastMonth(
  expenses: readonly Expense[],
  todayKey: string,
): MonthComparison {
  const monthKey = monthKeyOf(todayKey)
  const prevKey = previousMonthKey(monthKey)
  const today = dayOf(todayKey)
  const prevDays = daysInMonth(prevKey)
  const isLastDayOfMonth = today === daysInMonth(monthKey)
  const previousUntilDay = isLastDayOfMonth ? prevDays : Math.min(today, prevDays)

  const current = expensesInMonth(expenses, monthKey).filter((e) => dayOf(e.date) <= today)
  const previousMonth = expensesInMonth(expenses, prevKey)
  const previous = previousMonth.filter((e) => dayOf(e.date) <= previousUntilDay)

  return {
    current: { waste: sumByRating(current, '無駄'), questionable: sumByRating(current, '微妙') },
    previous: { waste: sumByRating(previous, '無駄'), questionable: sumByRating(previous, '微妙') },
    previousUntilDay,
    hasPreviousRecords: previousMonth.length > 0,
  }
}

/** カテゴリ別の合計 */
export interface CategoryTotal {
  category: Category
  total: number
}

/** カテゴリ別の合計を、金額の大きい順に返す（0円のカテゴリは出さない） */
export function totalsByCategory(expenses: readonly Expense[]): CategoryTotal[] {
  const totals = new Map<Category, number>()
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

/** 今月「無駄」「微妙」にした支出（新しい順） */
export function wastefulExpenses(expenses: readonly Expense[], monthKey: string): Expense[] {
  return sortNewestFirst(
    expensesInMonth(expenses, monthKey).filter((e) => e.rating === '無駄' || e.rating === '微妙'),
  )
}
