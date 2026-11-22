// アプリ全体で使う型と定数

/** 評価（3段階） */
export const RATINGS = ['必要', '微妙', '無駄'] as const
export type Rating = (typeof RATINGS)[number]

/** カテゴリ（14個） */
export const CATEGORIES = [
  '食費',
  '外食費',
  '日用品',
  '交通費',
  '衣服',
  '交際費',
  '趣味',
  '通信費',
  'ローン',
  '電気・水道代',
  '理髪・美容',
  '貯金',
  'サブスク',
  'その他',
] as const
export type Category = (typeof CATEGORIES)[number]

/** 固定費のカテゴリ。入力時は評価を自動で「必要」にする */
export const FIXED_CATEGORIES: readonly Category[] = [
  '通信費',
  'ローン',
  '電気・水道代',
  '貯金',
  'サブスク',
]

export function isFixedCategory(category: Category): boolean {
  return FIXED_CATEGORIES.includes(category)
}

/** 支出1件 */
export interface Expense {
  id: string
  /** 金額（円、正の整数） */
  amount: number
  category: Category
  rating: Rating
  /** 支出した日（端末のローカル時間で YYYY-MM-DD） */
  date: string
  /** 記録した時刻（ミリ秒）。同じ日の並び順に使う */
  createdAt: number
}

/** 設定 */
export interface Settings {
  /** 月の予算（円）。0 は未設定 */
  monthlyBudget: number
}

export const DEFAULT_SETTINGS: Settings = { monthlyBudget: 0 }
