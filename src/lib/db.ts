// データの保存先（ブラウザの IndexedDB）
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DEFAULT_SETTINGS, type Expense, type Settings } from './types'

interface KakeiboDB extends DBSchema {
  expenses: { key: string; value: Expense }
  settings: { key: string; value: Settings }
}

const DB_NAME = 'kakeibo'
const DB_VERSION = 1
const SETTINGS_KEY = 'main'

let dbPromise: Promise<IDBPDatabase<KakeiboDB>> | undefined

function getDB(): Promise<IDBPDatabase<KakeiboDB>> {
  dbPromise ??= openDB<KakeiboDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('expenses', { keyPath: 'id' })
      db.createObjectStore('settings')
    },
  })
  return dbPromise
}

/** 保存されているデータをすべて読み込む */
export async function loadAll(): Promise<{ expenses: Expense[]; settings: Settings }> {
  const db = await getDB()
  const [expenses, settings] = await Promise.all([
    db.getAll('expenses'),
    db.get('settings', SETTINGS_KEY),
  ])
  return { expenses, settings: { ...DEFAULT_SETTINGS, ...settings } }
}

/** 支出を1件保存する（同じIDがあれば上書き） */
export async function putExpense(expense: Expense): Promise<void> {
  const db = await getDB()
  await db.put('expenses', expense)
}

/** 支出を1件削除する */
export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('expenses', id)
}

/** 設定を保存する */
export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB()
  await db.put('settings', settings, SETTINGS_KEY)
}

/** データをまるごと入れ替える（バックアップの読み込み用）。途中で失敗したら何も変わらない */
export async function replaceAll(expenses: Expense[], settings: Settings): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['expenses', 'settings'], 'readwrite')
  const expenseStore = tx.objectStore('expenses')
  await expenseStore.clear()
  for (const e of expenses) {
    await expenseStore.put(e)
  }
  await tx.objectStore('settings').put(settings, SETTINGS_KEY)
  await tx.done
}

/**
 * ブラウザに「このデータは勝手に消さないで」とお願いする。
 * iPhoneのSafariでは、ホーム画面に追加したアプリなら認められやすい。
 * 認められたら true。使えないブラウザでは false。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
