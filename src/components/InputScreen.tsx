// 入力画面：金額 → カテゴリ → 評価 の3ステップで保存する
import { useState } from 'react'
import { formatDateLabel } from '../lib/date'
import { formatYen } from '../lib/format'
import { CATEGORIES, RATINGS, isFixedCategory, type Category, type Rating } from '../lib/types'
import type { NewExpense } from '../hooks/useAppData'
import { RATING_CLASS } from '../lib/ratingStyle'

interface Props {
  today: string
  onSave: (input: NewExpense) => Promise<void>
}

/** 入力できる金額の上限（7桁） */
const MAX_AMOUNT = 9_999_999

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'] as const

export function InputScreen({ today, onSave }: Props) {
  const [step, setStep] = useState<'amount' | 'category' | 'rating'>('amount')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState<Category | null>(null)
  // 日付は空なら「今日」。過去の分を記録したいときだけ選ぶ
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  const pressKey = (key: (typeof KEYS)[number]) => {
    if (key === '⌫') {
      setAmount((a) => Math.floor(a / 10))
      return
    }
    setAmount((a) => {
      const next = Number(`${a}${key}`)
      return next > MAX_AMOUNT ? a : next
    })
  }

  const save = async (selectedCategory: Category, rating: Rating) => {
    if (saving) return
    setSaving(true)
    try {
      await onSave({ amount, category: selectedCategory, rating, date: date || today })
    } catch (error) {
      console.error(error)
      alert('保存できませんでした。もう一度お試しください。')
      setSaving(false)
    }
  }

  const chooseCategory = (c: Category) => {
    // 固定費は評価を選ばずに「必要」で保存する
    if (isFixedCategory(c)) {
      void save(c, '必要')
      return
    }
    setCategory(c)
    setStep('rating')
  }

  return (
    <div className="screen input-screen">
      <div className="input-summary">
        <div className="input-amount">{formatYen(amount)}</div>
        <div className="input-meta">
          {category && <span>{category}</span>}
          <label className="date-chip">
            {date && date !== today ? formatDateLabel(date) : '今日'}
            <input
              type="date"
              value={date || today}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              aria-label="日付"
            />
          </label>
        </div>
      </div>

      <ol className="steps" aria-label="入力の手順">
        <li className={step === 'amount' ? 'active' : ''}>① 金額</li>
        <li className={step === 'category' ? 'active' : ''}>② カテゴリ</li>
        <li className={step === 'rating' ? 'active' : ''}>③ 評価</li>
      </ol>

      {step === 'amount' && (
        <>
          <div className="keypad">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className="key"
                onClick={() => pressKey(key)}
                aria-label={key === '⌫' ? '1文字消す' : key}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={amount === 0}
            onClick={() => setStep('category')}
          >
            次へ
          </button>
        </>
      )}

      {step === 'category' && (
        <>
          <div className="category-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`category-button ${isFixedCategory(c) ? 'fixed' : ''}`}
                onClick={() => chooseCategory(c)}
                disabled={saving}
              >
                {c}
                {isFixedCategory(c) && <span className="tag">固定費</span>}
              </button>
            ))}
          </div>
          <p className="hint">固定費のカテゴリは「必要」でそのまま保存します</p>
          <button type="button" className="back-button" onClick={() => setStep('amount')}>
            ← 金額に戻る
          </button>
        </>
      )}

      {step === 'rating' && category && (
        <>
          <div className="rating-buttons">
            {RATINGS.map((r) => (
              <button
                key={r}
                type="button"
                className={`rating-button ${RATING_CLASS[r]}`}
                onClick={() => void save(category, r)}
                disabled={saving}
              >
                {r}
              </button>
            ))}
          </div>
          <button type="button" className="back-button" onClick={() => setStep('category')}>
            ← カテゴリに戻る
          </button>
        </>
      )}
    </div>
  )
}
