// アプリのデータ（支出と設定）を読み込み・保存するフック
import { useCallback, useEffect, useState } from 'react'
import * as db from '../lib/db'
import { monthKeyOf } from '../lib/date'
import {
  applyFixedCosts,
  createFixedCostExpense,
  currentMonthRecords,
  syncCurrentMonthRecords,
} from '../lib/fixedCosts'
import { DEFAULT_SETTINGS, type Expense, type FixedCost, type Settings } from '../lib/types'

export type NewExpense = Omit<Expense, 'id' | 'createdAt'>
export type FixedCostInput = Pick<FixedCost, 'label' | 'category' | 'amount'>

/** IDを作る（crypto.randomUUID は https か localhost でしか使えないので、その他の場合の予備あり） */
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** まだ記録していない月の固定費を記録してから、全データを読み込む */
async function applyFixedCostsAndLoad(currentMonth: string) {
  await db.applyFixedCosts((settings) => {
    const result = applyFixedCosts(settings.fixedCosts, currentMonth, createId, Date.now())
    return { newExpenses: result.newExpenses, settings: { ...settings, fixedCosts: result.fixedCosts } }
  })
  return db.loadAll()
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
  addFixedCost: (input: FixedCostInput) => Promise<void>
  updateFixedCost: (fixedCost: FixedCost) => Promise<void>
  removeFixedCost: (id: string) => Promise<void>
  replaceAllData: (expenses: Expense[], settings: Settings) => Promise<void>
}

export function useAppData(today: string): AppData {
  const currentMonth = monthKeyOf(today)
  const [status, setStatus] = useState<AppData['status']>('loading')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  // 起動したときと、月が変わったときに、その月の固定費を自動で記録する
  useEffect(() => {
    let cancelled = false
    applyFixedCostsAndLoad(currentMonth)
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
    return () => {
      cancelled = true
    }
  }, [currentMonth])

  useEffect(() => {
    let cancelled = false
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

  /** 固定費を登録し、今月分もすぐに記録する */
  const addFixedCost = useCallback(
    async (input: FixedCostInput) => {
      const fixedCost: FixedCost = { ...input, id: createId(), lastAppliedMonth: currentMonth }
      const record = createFixedCostExpense(fixedCost, currentMonth, createId(), Date.now())
      const next = { ...settings, fixedCosts: [...settings.fixedCosts, fixedCost] }
      await db.saveSettingsAndExpenses(next, [record])
      setSettings(next)
      setExpenses((prev) => [...prev, record])
    },
    [settings, currentMonth],
  )

  /** 固定費の登録内容を変え、今月の自動記録にも反映する（先月以前はそのまま） */
  const updateFixedCost = useCallback(
    async (fixedCost: FixedCost) => {
      const next = {
        ...settings,
        fixedCosts: settings.fixedCosts.map((fc) => (fc.id === fixedCost.id ? fixedCost : fc)),
      }
      const synced = syncCurrentMonthRecords(expenses, fixedCost, currentMonth)
      await db.saveSettingsAndExpenses(next, synced)
      setSettings(next)
      setExpenses((prev) => prev.map((e) => synced.find((s) => s.id === e.id) ?? e))
    },
    [settings, expenses, currentMonth],
  )

  /** 固定費の登録をやめ、今月の自動記録も消す（先月以前はそのまま） */
  const removeFixedCost = useCallback(
    async (id: string) => {
      const next = { ...settings, fixedCosts: settings.fixedCosts.filter((fc) => fc.id !== id) }
      const deleteIds = currentMonthRecords(expenses, id, currentMonth).map((e) => e.id)
      await db.saveSettingsAndExpenses(next, [], deleteIds)
      setSettings(next)
      setExpenses((prev) => prev.filter((e) => !deleteIds.includes(e.id)))
    },
    [settings, expenses, currentMonth],
  )

  /** バックアップから読み込む。古いバックアップなら、抜けている月の固定費もここで記録する */
  const replaceAllData = useCallback(
    async (nextExpenses: Expense[], nextSettings: Settings) => {
      await db.replaceAll(nextExpenses, nextSettings)
      const data = await applyFixedCostsAndLoad(currentMonth)
      setExpenses(data.expenses)
      setSettings(data.settings)
    },
    [currentMonth],
  )

  return {
    status,
    expenses,
    settings,
    persisted,
    addExpense,
    updateExpense,
    removeExpense,
    updateSettings,
    addFixedCost,
    updateFixedCost,
    removeFixedCost,
    replaceAllData,
  }
}
