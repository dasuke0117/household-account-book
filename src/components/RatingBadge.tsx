// 評価（必要／微妙／無駄）のバッジ
import { RATING_CLASS } from '../lib/ratingStyle'
import type { Rating } from '../lib/types'

export function RatingBadge({ rating }: { rating: Rating }) {
  return <span className={`badge ${RATING_CLASS[rating]}`}>{rating}</span>
}
