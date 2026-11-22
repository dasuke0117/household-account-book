// ホーム画面：開いた瞬間に「あと使える金額」と「今月の無駄遣い」が分かる
import { calcMonthSummary, compareWithLastMonth, sortNewestFirst } from '../lib/budget'
import { formatDateLabel, formatMonthLabel, monthKeyOf } from '../lib/date'
import { formatYen } from '../lib/format'
import type { Expense } from '../lib/types'
import { ExpenseRow } from './ExpenseRow'

interface Props {
  expenses: Expense[]
  budget: number
  today: string
  onOpenSettings: () => void
  onEdit: (expense: Expense) => void
}

/** 先月より増えた／減ったの一言 */
function Diff({
  current,
  previous,
  hasPrevious,
}: {
  current: number
  previous: number
  hasPrevious: boolean
}) {
  if (!hasPrevious) return <span className="diff diff-same">先月の記録なし</span>
  const diff = current - previous
  if (diff === 0) return <span className="diff diff-same">先月と同じ</span>
  if (diff > 0) return <span className="diff diff-up">先月より {formatYen(diff)} 増 ↑</span>
  return <span className="diff diff-down">先月より {formatYen(-diff)} 減 ↓</span>
}

export function HomeScreen({ expenses, budget, today, onOpenSettings, onEdit }: Props) {
  const s = calcMonthSummary(expenses, budget, today)
  const c = compareWithLastMonth(expenses, today)
  const recent = sortNewestFirst(expenses).slice(0, 5)

  return (
    <div className="screen">
      <p className="screen-sub">
        {formatMonthLabel(monthKeyOf(today))}・{formatDateLabel(today)}
      </p>

      {budget === 0 && (
        <button type="button" className="banner" onClick={onOpenSettings}>
          まず「設定」で月の予算を入れてください →
        </button>
      )}

      <section className="card card-main">
        <p className="card-label">今月あと使える金額</p>
        <p className={`amount-xl ${s.remaining < 0 ? 'negative' : ''}`}>{formatYen(s.remaining)}</p>
        <div className="today-row">
          <span>今日使っていい金額</span>
          <strong className={s.todayAllowance < 0 ? 'negative' : ''}>
            {formatYen(s.todayAllowance)}
          </strong>
        </div>
        <p className="card-note">
          今日使った額 {formatYen(s.spentToday)}・残り{s.daysLeft}日
        </p>
      </section>

      <div className="card-pair">
        <section className="card card-waste">
          <p className="card-label">今月の「無駄」</p>
          <p className="amount-lg">{formatYen(s.wasteTotal)}</p>
          <Diff
            current={c.current.waste}
            previous={c.previous.waste}
            hasPrevious={c.hasPreviousRecords}
          />
        </section>
        <section className="card card-questionable">
          <p className="card-label">今月の「微妙」</p>
          <p className="amount-lg">{formatYen(s.questionableTotal)}</p>
          <Diff
            current={c.current.questionable}
            previous={c.previous.questionable}
            hasPrevious={c.hasPreviousRecords}
          />
        </section>
      </div>
      {c.hasPreviousRecords && (
        <p className="hint">先月比較は、先月の{c.previousUntilDay}日までと比べています</p>
      )}

      <section className="card">
        <dl className="breakdown">
          <dt>月の予算</dt>
          <dd>{formatYen(s.budget)}</dd>
          <dt>固定費</dt>
          <dd>−{formatYen(s.fixedTotal)}</dd>
          <dt>自由に使えるお金</dt>
          <dd>{formatYen(s.freeMoney)}</dd>
          <dt>固定費以外で使った額</dt>
          <dd>−{formatYen(s.variableSpent)}</dd>
        </dl>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="section-title">最近の記録</h2>
          <ul className="expense-list card">
            {recent.map((e) => (
              <ExpenseRow key={e.id} expense={e} showDate onClick={() => onEdit(e)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
