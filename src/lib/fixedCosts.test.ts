import { describe, expect, it } from 'vitest'
import { applyFixedCosts, monthsToApply, syncCurrentMonthRecords } from './fixedCosts'
import type { Expense, FixedCost } from './types'

function fixedCost(overrides: Partial<FixedCost> = {}): FixedCost {
  return {
    id: 'fc1',
    label: 'Netflix',
    category: 'サブスク',
    amount: 1490,
    lastAppliedMonth: '',
    ...overrides,
  }
}

function idMaker() {
  let n = 0
  return () => `id${++n}`
}

describe('monthsToApply（自動で記録する月）', () => {
  it('登録したばかりなら今月だけ', () => {
    expect(monthsToApply('', '2026-11')).toEqual(['2026-11'])
  })

  it('今月もう記録していれば何もしない', () => {
    expect(monthsToApply('2026-11', '2026-11')).toEqual([])
  })

  it('新しい月になったら、その月を記録する', () => {
    expect(monthsToApply('2026-11', '2026-12')).toEqual(['2026-12'])
  })

  it('何か月も開かなかったら、抜けている月をすべて記録する（年をまたいでも）', () => {
    expect(monthsToApply('2026-11', '2027-02')).toEqual(['2026-12', '2027-01', '2027-02'])
  })
})

describe('applyFixedCosts（固定費の自動記録）', () => {
  it('その月の1日付けで「必要」の記録を作り、名前をメモに入れる', () => {
    const { newExpenses, fixedCosts } = applyFixedCosts([fixedCost()], '2026-11', idMaker(), 123)
    expect(newExpenses).toEqual([
      {
        id: 'id1',
        amount: 1490,
        category: 'サブスク',
        rating: '必要',
        date: '2026-11-01',
        createdAt: 123,
        memo: 'Netflix',
        fixedCostId: 'fc1',
      },
    ])
    expect(fixedCosts[0].lastAppliedMonth).toBe('2026-11')
  })

  it('同じ月に2回呼んでも、記録は増えない', () => {
    const first = applyFixedCosts([fixedCost()], '2026-11', idMaker(), 0)
    const second = applyFixedCosts(first.fixedCosts, '2026-11', idMaker(), 0)
    expect(second.newExpenses).toEqual([])
  })

  it('抜けている月の分も作る', () => {
    const { newExpenses } = applyFixedCosts(
      [fixedCost({ lastAppliedMonth: '2026-10' })],
      '2026-12',
      idMaker(),
      0,
    )
    expect(newExpenses.map((e) => e.date)).toEqual(['2026-11-01', '2026-12-01'])
  })

  it('記録済みの固定費と、まだの固定費が混ざっていても正しく作る', () => {
    const { newExpenses } = applyFixedCosts(
      [
        fixedCost({ id: 'a', lastAppliedMonth: '2026-11' }),
        fixedCost({ id: 'b', label: 'スマホ代', category: '通信費', amount: 3000 }),
      ],
      '2026-11',
      idMaker(),
      0,
    )
    expect(newExpenses.map((e) => e.fixedCostId)).toEqual(['b'])
  })
})

describe('syncCurrentMonthRecords（登録内容の変更を今月分に反映）', () => {
  const base: Omit<Expense, 'id' | 'date'> = {
    amount: 1490,
    category: 'サブスク',
    rating: '無駄',
    createdAt: 0,
    memo: 'Netflix',
    fixedCostId: 'fc1',
  }

  it('今月分だけ金額・カテゴリ・名前を変え、評価はそのまま残す', () => {
    const expenses: Expense[] = [
      { ...base, id: 'oct', date: '2026-10-01' },
      { ...base, id: 'nov', date: '2026-11-01' },
      { ...base, id: 'other', date: '2026-11-01', fixedCostId: 'fc2' },
    ]
    const changed = fixedCost({ amount: 1980, label: 'Netflix（プレミアム）' })
    expect(syncCurrentMonthRecords(expenses, changed, '2026-11')).toEqual([
      { ...base, id: 'nov', date: '2026-11-01', amount: 1980, memo: 'Netflix（プレミアム）' },
    ])
  })
})
