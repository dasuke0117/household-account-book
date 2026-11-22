import type { Rating } from './types'

/** 評価ごとのCSSクラス名（色分けに使う） */
export const RATING_CLASS: Record<Rating, string> = {
  必要: 'rating-necessary',
  微妙: 'rating-questionable',
  無駄: 'rating-waste',
}
