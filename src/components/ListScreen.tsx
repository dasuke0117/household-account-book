// 一覧画面：「無駄」「微妙」にした支出とカテゴリ別合計。「すべて」で全部の記録も見られる
import { useState } from 'react'
import { expensesInMonth, sortNewestFirst, totalsByCategory, wastefulExpenses } from '../lib/budget'
import { formatMonthLabel, monthKeyOf, nextMonthKey, previousMonthKey } from '../lib/date'
import { formatYen } from '../lib/format'
import type { Expense } from '../lib/types'
import { ExpenseRow } from './ExpenseRow'

interface Props {
  expenses: Expense[]
  today: string
  onEdit: (expense: Expense) => void
}

export function ListScreen({ expenses, today, onEdit }: Props) {
  const currentMonth = monthKeyOf(today)
  const [monthKey, setMonthKey] = useState(currentMonth)
  const [view, setView] = useState<'wasteful' | 'all'>('wasteful')

  const wasteful = wastefulExpenses(expenses, monthKey)
  const all = sortNewestFirst(expensesInMonth(expenses, monthKey))
  const rows = view === 'wasteful' ? wasteful : all
  const wasteTotal = wasteful.filter((e) => e.rating === '無駄').reduce((t, e) => t + e.amount, 0)
  const questionableTotal = wasteful
    .filter((e) => e.rating === '微妙')
    .reduce((t, e) => t + e.amount, 0)
  const categoryTotals = totalsByCategory(view === 'wasteful' ? wasteful : all)
  const maxCategoryTotal = categoryTotals[0]?.total ?? 0

  return (
    <div className="screen">
      <div className="month-switcher">
        <button
          type="button"
          onClick={() => setMonthKey(previousMonthKey(monthKey))}
          aria-label="前の月"
        >
          ‹
        </button>
        <span>{formatMonthLabel(monthKey)}</span>
        <button
          type="button"
          onClick={() => setMonthKey(nextMonthKey(monthKey))}
          disabled={monthKey >= currentMonth}
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'wasteful'}
          className={view === 'wasteful' ? 'active' : ''}
          onClick={() => setView('wasteful')}
        >
          無駄・微妙
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'all'}
          className={view === 'all' ? 'active' : ''}
          onClick={() => setView('all')}
        >
          すべて
        </button>
      </div>

      {view === 'wasteful' && (
        <div className="card-pair">
          <section className="card card-waste">
            <p className="card-label">無駄</p>
            <p className="amount-lg">{formatYen(wasteTotal)}</p>
          </section>
          <section className="card card-questionable">
            <p className="card-label">微妙</p>
            <p className="amount-lg">{formatYen(questionableTotal)}</p>
          </section>
        </div>
      )}

      {categoryTotals.length > 0 && (
        <section className="card">
          <h2 className="section-title">カテゴリ別</h2>
          <ul className="category-totals">
            {categoryTotals.map(({ category, total }) => (
              <li key={category}>
                <span className="category-name">{category}</span>
                <span className="bar">
                  <span style={{ width: `${(total / maxCategoryTotal) * 100}%` }} />
                </span>
                <span className="category-total">{formatYen(total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="empty">
          {view === 'wasteful' ? '「無駄」「微妙」の記録はありません 🎉' : 'まだ記録がありません'}
        </p>
      ) : (
        <ul className="expense-list card">
          {rows.map((e) => (
            <ExpenseRow key={e.id} expense={e} showDate onClick={() => onEdit(e)} />
          ))}
        </ul>
      )}
    </div>
  )
}
