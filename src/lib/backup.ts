// バックアップ（JSONファイルへの書き出し・読み込み）
import { isValidDateKey } from './date'
import { CATEGORIES, RATINGS, type Expense, type Settings } from './types'

const APP_ID = 'household-account-book'
const BACKUP_VERSION = 1

export interface BackupData {
  settings: Settings
  expenses: Expense[]
}

/** 書き出す内容をJSON文字列にする */
export function createBackupJson(data: BackupData, now: Date = new Date()): string {
  return JSON.stringify(
    {
      app: APP_ID,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      settings: data.settings,
      expenses: data.expenses,
    },
    null,
    2,
  )
}

/** バックアップファイルの名前（例：kakeibo-backup-2026-11-23.json） */
export function backupFileName(todayKey: string): string {
  return `kakeibo-backup-${todayKey}.json`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function parseExpense(value: unknown, index: number): Expense {
  const where = `${index + 1}件目の支出`
  if (!isRecord(value)) throw new Error(`${where}の形式が正しくありません`)
  const { id, amount, category, rating, date, createdAt } = value
  if (typeof id !== 'string' || id === '') throw new Error(`${where}のIDが正しくありません`)
  if (!isPositiveInteger(amount)) throw new Error(`${where}の金額が正しくありません`)
  if (!CATEGORIES.includes(category as Expense['category'])) {
    throw new Error(`${where}のカテゴリ「${String(category)}」は使えません`)
  }
  if (!RATINGS.includes(rating as Expense['rating'])) {
    throw new Error(`${where}の評価「${String(rating)}」は使えません`)
  }
  if (typeof date !== 'string' || !isValidDateKey(date)) {
    throw new Error(`${where}の日付が正しくありません`)
  }
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) {
    throw new Error(`${where}の記録時刻が正しくありません`)
  }
  return {
    id,
    amount,
    category: category as Expense['category'],
    rating: rating as Expense['rating'],
    date,
    createdAt,
  }
}

/**
 * バックアップのJSON文字列を読み込む。
 * 中身がおかしいときは、理由を日本語で書いたエラーを投げる。
 */
export function parseBackupJson(text: string): BackupData {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSONファイルとして読み込めませんでした')
  }
  if (!isRecord(data) || data.app !== APP_ID) {
    throw new Error('この家計簿のバックアップファイルではありません')
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new Error('新しいバージョンのアプリで作られたファイルのため、読み込めません')
  }

  const settings = data.settings
  if (
    !isRecord(settings) ||
    typeof settings.monthlyBudget !== 'number' ||
    !Number.isInteger(settings.monthlyBudget) ||
    settings.monthlyBudget < 0
  ) {
    throw new Error('予算の設定が正しくありません')
  }

  if (!Array.isArray(data.expenses)) throw new Error('支出のデータが見つかりません')
  const expenses = data.expenses.map(parseExpense)
  if (new Set(expenses.map((e) => e.id)).size !== expenses.length) {
    throw new Error('同じIDの支出が重複しています')
  }

  return { settings: { monthlyBudget: settings.monthlyBudget }, expenses }
}
