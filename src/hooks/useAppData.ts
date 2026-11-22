// アプリのデータ（支出と設定）を読み込み・保存するフック
import { useCallback, useEffect, useState } from 'react'
import * as db from '../lib/db'
import { DEFAULT_SETTINGS, type Expense, type Settings } from '../lib/types'

export type NewExpense = Omit<Expense, 'id' | 'createdAt'>

/** 支出のIDを作る（crypto.randomUUID は https か localhost でしか使えないので、その他の場合の予備あり） */
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export interface AppData {
  status: 'loading' | 'ready' | 'error'
  expenses: Expense[]
  settings: Settings
  /** データが勝手に消されない設定になっているか（不明なら null） */
  persisted: boolean | null
  addExpense: (input: NewExpense) => Promise<void>
  updateExpense: (expense: Expense) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  updateSettings: (settings: Settings) => Promise<void>
  replaceAllData: (expenses: Expense[], settings: Settings) => Promise<void>
}

export function useAppData(): AppData {
  const [status, setStatus] = useState<AppData['status']>('loading')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    db.loadAll()
      .then((data) => {
        if (cancelled) return
        setExpenses(data.expenses)
        setSettings(data.settings)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error(error)
        if (!cancelled) setStatus('error')
      })
    db.requestPersistentStorage().then((result) => {
      if (!cancelled) setPersisted(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 保存に成功してから画面のデータを更新する（保存できていないのに表示だけ変わるのを防ぐ）
  const addExpense = useCallback(async (input: NewExpense) => {
    const expense: Expense = { ...input, id: createId(), createdAt: Date.now() }
    await db.putExpense(expense)
    setExpenses((prev) => [...prev, expense])
  }, [])

  const updateExpense = useCallback(async (expense: Expense) => {
    await db.putExpense(expense)
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)))
  }, [])

  const removeExpense = useCallback(async (id: string) => {
    await db.deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateSettings = useCallback(async (next: Settings) => {
    await db.saveSettings(next)
    setSettings(next)
  }, [])

  const replaceAllData = useCallback(async (nextExpenses: Expense[], nextSettings: Settings) => {
    await db.replaceAll(nextExpenses, nextSettings)
    setExpenses(nextExpenses)
    setSettings(nextSettings)
  }, [])

  return {
    status,
    expenses,
    settings,
    persisted,
    addExpense,
    updateExpense,
    removeExpense,
    updateSettings,
    replaceAllData,
  }
}
