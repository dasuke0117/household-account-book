// 支出1件の行（タップで編集）
import { formatDateLabel } from '../lib/date'
import { formatYen } from '../lib/format'
import { isFixedCategory, type Expense } from '../lib/types'
import { RatingBadge } from './RatingBadge'

interface Props {
  expense: Expense
  showDate?: boolean
  onClick: () => void
}

export function ExpenseRow({ expense, showDate = false, onClick }: Props) {
  return (
    <li>
      <button type="button" className="expense-row" onClick={onClick}>
        <span className="expense-main">
          <span className="expense-category">
            {expense.category}
            {isFixedCategory(expense.category) && <span className="tag">固定費</span>}
          </span>
          {showDate && <span className="expense-date">{formatDateLabel(expense.date)}</span>}
        </span>
        <RatingBadge rating={expense.rating} />
        <span className="expense-amount">{formatYen(expense.amount)}</span>
      </button>
    </li>
  )
}
