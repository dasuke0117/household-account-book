// 毎月の固定費の登録・編集
import { useState } from 'react'
import type { FixedCostInput } from '../hooks/useAppData'
import { FIXED_CATEGORIES, type Category, type FixedCost } from '../lib/types'

interface Props {
  /** 編集するときは今の内容。新しく登録するときは undefined */
  fixedCost?: FixedCost
  onSave: (input: FixedCostInput) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function FixedCostSheet({ fixedCost, onSave, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(fixedCost?.label ?? '')
  const [category, setCategory] = useState<Category>(fixedCost?.category ?? FIXED_CATEGORIES[0])
  const [amountText, setAmountText] = useState(fixedCost ? String(fixedCost.amount) : '')
  const [busy, setBusy] = useState(false)

  const amount = Number(amountText)
  const valid = label.trim() !== '' && Number.isInteger(amount) && amount > 0 && amount <= 9_999_999

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

  const save = () => run(() => onSave({ label: label.trim(), category, amount }))

  const remove = () => {
    if (!onDelete) return
    if (!confirm(`「${fixedCost?.label}」の登録をやめますか？\n来月から自動で記録されなくなり、今月分の記録も消えます（先月以前の記録は残ります）。`)) {
      return
    }
    void run(onDelete)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="毎月の固定費"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="sheet-title">{fixedCost ? '毎月の固定費を変更' : '毎月の固定費を登録'}</h2>

        <label className="field">
          <span className="field-label">名前</span>
          <input
            type="text"
            placeholder="例：スマホ代、Netflix"
            value={label}
            maxLength={30}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">カテゴリ</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {FIXED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">毎月の金額（円）</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="例：3000"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
          />
        </label>

        <p className="hint left">
          {fixedCost
            ? '変更すると、今月分の記録も同じ内容に変わります（先月以前の記録はそのままです）。'
            : '登録すると、今月分をすぐに記録し、来月からは毎月1日付けで自動で記録します。'}
        </p>

        <div className="sheet-actions">
          <button type="button" className="primary-button" onClick={save} disabled={!valid || busy}>
            {fixedCost ? '変更する' : '登録する'}
          </button>
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            キャンセル
          </button>
          {onDelete && (
            <button type="button" className="danger-link" onClick={remove} disabled={busy}>
              この固定費の登録をやめる
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
