// 支出の編集（評価・金額・カテゴリ・日付の変更と削除）
import { useState } from 'react'
import { isValidDateKey } from '../lib/date'
import { CATEGORIES, RATINGS, type Category, type Expense } from '../lib/types'
import { RATING_CLASS } from '../lib/ratingStyle'

interface Props {
  expense: Expense
  today: string
  onSave: (expense: Expense) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function EditSheet({ expense, today, onSave, onDelete, onClose }: Props) {
  const [amountText, setAmountText] = useState(String(expense.amount))
  const [category, setCategory] = useState<Category>(expense.category)
  const [rating, setRating] = useState(expense.rating)
  const [date, setDate] = useState(expense.date)
  const [memo, setMemo] = useState(expense.memo ?? '')
  const [busy, setBusy] = useState(false)

  const amount = Number(amountText)
  const valid = Number.isInteger(amount) && amount > 0 && amount <= 9_999_999 && isValidDateKey(date)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
      onClose()
    } catch (error) {
      console.error(error)
      alert('保存できませんでした。もう一度お試しください。')
      setBusy(false)
    }
  }

  const save = () =>
    run(() => {
      const { memo: _oldMemo, ...rest } = expense
      const trimmed = memo.trim()
      return onSave({ ...rest, amount, category, rating, date, ...(trimmed && { memo: trimmed }) })
    })

  const remove = () => {
    if (!confirm('この記録を削除しますか？')) return
    void run(() => onDelete(expense.id))
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="記録の編集"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="sheet-title">記録の編集</h2>
        {expense.fixedCostId && (
          <p className="hint left">
            毎月の固定費から自動で記録したものです。ここで変えるのはこの月の分だけです。来月以降の金額は「設定」の毎月の固定費で変えてください。
          </p>
        )}

        <p className="field-label">評価</p>
        <div className="rating-buttons rating-buttons-small">
          {RATINGS.map((r) => (
            <button
              key={r}
              type="button"
              className={`rating-button ${RATING_CLASS[r]} ${rating === r ? 'selected' : ''}`}
              onClick={() => setRating(r)}
              aria-pressed={rating === r}
            >
              {r}
            </button>
          ))}
        </div>

        <label className="field">
          <span className="field-label">金額（円）</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </label>

        <label className="field">
          <span className="field-label">カテゴリ</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">日付</span>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">メモ</span>
          <input
            type="text"
            value={memo}
            maxLength={30}
            placeholder="なし"
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>

        <div className="sheet-actions">
          <button type="button" className="primary-button" onClick={save} disabled={!valid || busy}>
            保存
          </button>
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            キャンセル
          </button>
          <button type="button" className="danger-link" onClick={remove} disabled={busy}>
            この記録を削除
          </button>
        </div>
      </div>
    </div>
  )
}
