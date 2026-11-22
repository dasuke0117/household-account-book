// 毎月の固定費を、自動で記録するためのロジック
import { monthKeyOf, nextMonthKey } from './date'
import type { Expense, FixedCost } from './types'

/**
 * 自動で記録する月の一覧
 * - まだ一度も記録していない（登録したばかり）なら、今月だけ
 * - アプリを何か月も開かなかった場合は、抜けている月をすべて
 */
export function monthsToApply(lastAppliedMonth: string, currentMonth: string): string[] {
  if (!lastAppliedMonth) return [currentMonth]
  const months: string[] = []
  for (let m = nextMonthKey(lastAppliedMonth); m <= currentMonth; m = nextMonthKey(m)) {
    months.push(m)
  }
  return months
}

/** 固定費1つから、その月の記録を作る（日付はその月の1日、評価は「必要」） */
export function createFixedCostExpense(
  fixedCost: FixedCost,
  monthKey: string,
  id: string,
  createdAt: number,
): Expense {
  return {
    id,
    amount: fixedCost.amount,
    category: fixedCost.category,
    rating: '必要',
    date: `${monthKey}-01`,
    createdAt,
    memo: fixedCost.label,
    fixedCostId: fixedCost.id,
  }
}

/**
 * まだ記録していない月の固定費の記録を作る。
 * 作った記録と、「最後に記録した月」を更新した固定費の一覧を返す。
 */
export function applyFixedCosts(
  fixedCosts: readonly FixedCost[],
  currentMonth: string,
  createId: () => string,
  now: number,
): { newExpenses: Expense[]; fixedCosts: FixedCost[] } {
  const newExpenses: Expense[] = []
  const updated = fixedCosts.map((fc) => {
    const months = monthsToApply(fc.lastAppliedMonth, currentMonth)
    if (months.length === 0) return fc
    for (const month of months) {
      newExpenses.push(createFixedCostExpense(fc, month, createId(), now))
    }
    return { ...fc, lastAppliedMonth: currentMonth }
  })
  return { newExpenses, fixedCosts: updated }
}

/** 固定費の登録内容を変えたときに、今月の自動記録にも同じ変更を反映したものを返す（先月以前はそのまま） */
export function syncCurrentMonthRecords(
  expenses: readonly Expense[],
  fixedCost: FixedCost,
  currentMonth: string,
): Expense[] {
  return expenses
    .filter((e) => e.fixedCostId === fixedCost.id && monthKeyOf(e.date) === currentMonth)
    .map((e) => ({
      ...e,
      amount: fixedCost.amount,
      category: fixedCost.category,
      memo: fixedCost.label,
    }))
}

/** 今月の、その固定費の自動記録 */
export function currentMonthRecords(
  expenses: readonly Expense[],
  fixedCostId: string,
  currentMonth: string,
): Expense[] {
  return expenses.filter(
    (e) => e.fixedCostId === fixedCostId && monthKeyOf(e.date) === currentMonth,
  )
}
