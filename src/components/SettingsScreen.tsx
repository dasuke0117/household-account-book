// 設定画面：月の予算、毎月の固定費、バックアップ
import { useRef, useState, type ChangeEvent } from 'react'
import type { FixedCostInput } from '../hooks/useAppData'
import { backupFileName, createBackupJson, parseBackupJson } from '../lib/backup'
import { formatYen } from '../lib/format'
import type { Expense, FixedCost, Settings } from '../lib/types'
import { FixedCostSheet } from './FixedCostSheet'

interface Props {
  settings: Settings
  expenses: Expense[]
  today: string
  persisted: boolean | null
  onSaveSettings: (settings: Settings) => Promise<void>
  onAddFixedCost: (input: FixedCostInput) => Promise<void>
  onUpdateFixedCost: (fixedCost: FixedCost) => Promise<void>
  onRemoveFixedCost: (id: string) => Promise<void>
  onReplaceAll: (expenses: Expense[], settings: Settings) => Promise<void>
}

/** ファイルを書き出す。iPhoneでは共有シート（「ファイル」に保存、AirDropなど）を使う */
async function exportFile(json: string, fileName: string): Promise<void> {
  const file = new File([json], fileName, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch (error) {
      // 共有シートを閉じただけならエラーにしない
      if (error instanceof DOMException && error.name === 'AbortError') return
      throw error
    }
    return
  }
  // 共有シートが使えないブラウザ（PCなど）は普通にダウンロードする
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function SettingsScreen({
  settings,
  expenses,
  today,
  persisted,
  onSaveSettings,
  onAddFixedCost,
  onUpdateFixedCost,
  onRemoveFixedCost,
  onReplaceAll,
}: Props) {
  const [budgetText, setBudgetText] = useState(
    settings.monthlyBudget > 0 ? String(settings.monthlyBudget) : '',
  )
  const [message, setMessage] = useState('')
  // 固定費のシート：null は閉じている、'new' は新規登録、FixedCost はその固定費の編集
  const [fixedCostSheet, setFixedCostSheet] = useState<FixedCost | 'new' | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const fixedCostTotal = settings.fixedCosts.reduce((t, fc) => t + fc.amount, 0)

  const budget = Number(budgetText)
  const budgetChanged = budget !== settings.monthlyBudget

  const saveBudget = async () => {
    try {
      await onSaveSettings({ ...settings, monthlyBudget: budget })
      setMessage(`月の予算を ${formatYen(budget)} にしました`)
    } catch (error) {
      console.error(error)
      setMessage('予算を保存できませんでした')
    }
  }

  const exportBackup = async () => {
    try {
      await exportFile(createBackupJson({ settings, expenses }), backupFileName(today))
    } catch (error) {
      console.error(error)
      setMessage('書き出しに失敗しました')
    }
  }

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // 同じファイルをもう一度選べるようにする
    if (!file) return
    try {
      const data = parseBackupJson(await file.text())
      const ok = confirm(
        `${data.expenses.length}件の記録を読み込みます。\n今の記録（${expenses.length}件）と予算はすべて置き換わります。よろしいですか？`,
      )
      if (!ok) return
      await onReplaceAll(data.expenses, data.settings)
      setBudgetText(data.settings.monthlyBudget > 0 ? String(data.settings.monthlyBudget) : '')
      setMessage(`${data.expenses.length}件の記録を読み込みました`)
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : '読み込みに失敗しました')
    }
  }

  return (
    <div className="screen">
      {message && (
        <p className="message" role="status">
          {message}
        </p>
      )}

      <section className="card">
        <h2 className="section-title">月の予算</h2>
        <p className="hint left">
          固定費（通信費・ローン・電気・水道代・貯金・サブスク）も含めた、1か月に使うお金の合計です。
        </p>
        <div className="budget-row">
          <span className="yen-prefix">¥</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="例：150000"
            value={budgetText}
            onChange={(e) => setBudgetText(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
            aria-label="月の予算（円）"
          />
          <button
            type="button"
            className="primary-button small"
            onClick={saveBudget}
            disabled={!budgetChanged}
          >
            保存
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">毎月の固定費</h2>
        <p className="hint left">
          登録しておくと、毎月1日付けで自動で記録します。電気代など月によって金額が違うものは、その月の記録を一覧から直してください。
        </p>
        {settings.fixedCosts.length > 0 && (
          <ul className="fixed-cost-list">
            {settings.fixedCosts.map((fc) => (
              <li key={fc.id}>
                <button type="button" className="fixed-cost-row" onClick={() => setFixedCostSheet(fc)}>
                  <span className="expense-main">
                    <span className="expense-category">{fc.label}</span>
                    <span className="expense-date">{fc.category}</span>
                  </span>
                  <span className="expense-amount">{formatYen(fc.amount)}</span>
                  <span className="chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
            ))}
            <li className="fixed-cost-total">
              <span>合計（毎月）</span>
              <strong>{formatYen(fixedCostTotal)}</strong>
            </li>
          </ul>
        )}
        <button
          type="button"
          className="secondary-button add-button"
          onClick={() => setFixedCostSheet('new')}
        >
          ＋ 固定費を登録
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">バックアップ</h2>
        <p className="hint left">
          記録はこのiPhoneのブラウザの中だけに保存されています。機種変更やもしものときのために、ときどき書き出して「ファイル」アプリなどに保存してください。
        </p>
        <div className="button-column">
          <button type="button" className="secondary-button" onClick={exportBackup}>
            書き出す（{expenses.length}件）
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => fileInput.current?.click()}
          >
            読み込む
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={importBackup}
          />
        </div>
        <p className="hint left">
          データの保護：
          {persisted === null
            ? '確認中…'
            : persisted
              ? 'オン（ブラウザが勝手に消さない設定です）'
              : 'オフ（ホーム画面に追加して使うと、消えにくくなります）'}
        </p>
      </section>

      {fixedCostSheet === 'new' && (
        <FixedCostSheet
          onSave={async (input) => {
            await onAddFixedCost(input)
            setMessage(`「${input.label}」を登録し、今月分を記録しました`)
          }}
          onClose={() => setFixedCostSheet(null)}
        />
      )}
      {fixedCostSheet && fixedCostSheet !== 'new' && (
        <FixedCostSheet
          fixedCost={fixedCostSheet}
          onSave={async (input) => {
            await onUpdateFixedCost({ ...fixedCostSheet, ...input })
            setMessage(`「${input.label}」を変更しました`)
          }}
          onDelete={async () => {
            await onRemoveFixedCost(fixedCostSheet.id)
            setMessage(`「${fixedCostSheet.label}」の登録をやめました`)
          }}
          onClose={() => setFixedCostSheet(null)}
        />
      )}
    </div>
  )
}
