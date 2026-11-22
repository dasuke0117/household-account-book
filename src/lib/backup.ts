// バックアップ（JSONファイルへの書き出し・読み込み）
import { isValidDateKey } from './date'
import { CATEGORIES, RATINGS, type Expense, type FixedCost, type Settings } from './types'

const APP_ID = 'household-account-book'
/** 1：最初の形式／2：毎月の固定費とメモを追加 */
const BACKUP_VERSION = 2

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
  const { memo, fixedCostId } = value
  if (memo !== undefined && typeof memo !== 'string') throw new Error(`${where}のメモが正しくありません`)
  if (fixedCostId !== undefined && typeof fixedCostId !== 'string') {
    throw new Error(`${where}の固定費IDが正しくありません`)
  }
  return {
    id,
    amount,
    category: category as Expense['category'],
    rating: rating as Expense['rating'],
    date,
    createdAt,
    ...(memo !== undefined && { memo }),
    ...(fixedCostId !== undefined && { fixedCostId }),
  }
}

function parseFixedCost(value: unknown, index: number): FixedCost {
  const where = `${index + 1}件目の毎月の固定費`
  if (!isRecord(value)) throw new Error(`${where}の形式が正しくありません`)
  const { id, label, category, amount, lastAppliedMonth } = value
  if (typeof id !== 'string' || id === '') throw new Error(`${where}のIDが正しくありません`)
  if (typeof label !== 'string') throw new Error(`${where}の名前が正しくありません`)
  if (!CATEGORIES.includes(category as FixedCost['category'])) {
    throw new Error(`${where}のカテゴリ「${String(category)}」は使えません`)
  }
  if (!isPositiveInteger(amount)) throw new Error(`${where}の金額が正しくありません`)
  if (
    typeof lastAppliedMonth !== 'string' ||
    (lastAppliedMonth !== '' && !isValidDateKey(`${lastAppliedMonth}-01`))
  ) {
    throw new Error(`${where}の記録済みの月が正しくありません`)
  }
  return { id, label, category: category as FixedCost['category'], amount, lastAppliedMonth }
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

  // バージョン1のファイルには毎月の固定費がないので、空として読み込む
  const rawFixedCosts = settings.fixedCosts ?? []
  if (!Array.isArray(rawFixedCosts)) throw new Error('毎月の固定費のデータが正しくありません')
  const fixedCosts = rawFixedCosts.map(parseFixedCost)

  return { settings: { monthlyBudget: settings.monthlyBudget, fixedCosts }, expenses }
}
