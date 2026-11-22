// アプリ全体：画面の切り替えと、データの受け渡し
import { useEffect, useState } from 'react'
import { EditSheet } from './components/EditSheet'
import { HomeScreen } from './components/HomeScreen'
import { InputScreen } from './components/InputScreen'
import { ListScreen } from './components/ListScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { useAppData, type NewExpense } from './hooks/useAppData'
import { useToday } from './hooks/useToday'
import { formatYen } from './lib/format'
import type { Expense } from './lib/types'

type Tab = 'home' | 'input' | 'list' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'input', label: '入力', icon: '＋' },
  { id: 'list', label: '一覧', icon: '📋' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]

const TITLES: Record<Tab, string> = {
  home: '無駄遣いストッパー家計簿',
  input: '支出を入力',
  list: '一覧',
  settings: '設定',
}

function App() {
  const data = useAppData()
  const today = useToday()
  const [tab, setTab] = useState<Tab>('home')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [toast, setToast] = useState('')

  // 保存しました、などの通知を少しだけ出す
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleAdd = async (input: NewExpense) => {
    await data.addExpense(input)
    setToast(`${input.category} ${formatYen(input.amount)}（${input.rating}）を保存しました`)
    setTab('home')
  }

  if (data.status === 'loading') {
    return <div className="center-message">読み込み中…</div>
  }
  if (data.status === 'error') {
    return (
      <div className="center-message">
        データを読み込めませんでした。
        <br />
        プライベートブラウズをオフにして、開き直してください。
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{TITLES[tab]}</h1>
      </header>

      <main className="app-main">
        {tab === 'home' && (
          <HomeScreen
            expenses={data.expenses}
            budget={data.settings.monthlyBudget}
            today={today}
            onOpenSettings={() => setTab('settings')}
            onEdit={setEditing}
          />
        )}
        {tab === 'input' && <InputScreen today={today} onSave={handleAdd} />}
        {tab === 'list' && <ListScreen expenses={data.expenses} today={today} onEdit={setEditing} />}
        {tab === 'settings' && (
          <SettingsScreen
            settings={data.settings}
            expenses={data.expenses}
            today={today}
            persisted={data.persisted}
            onSaveSettings={data.updateSettings}
            onReplaceAll={data.replaceAllData}
          />
        )}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${t.id === 'input' ? 'tab-input' : ''} ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              {t.icon}
            </span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {editing && (
        <EditSheet
          expense={editing}
          today={today}
          onSave={data.updateExpense}
          onDelete={data.removeExpense}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

export default App
