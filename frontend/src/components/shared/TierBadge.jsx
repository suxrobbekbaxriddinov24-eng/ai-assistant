import { TIERS } from '../../lib/constants'

export function TierBadge({ tier = 'free', size = 'sm' }) {
  const t = TIERS[tier] || TIERS.free
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }
  return (
    <span
      className={`rounded-full font-medium ${sizes[size]}`}
      style={{ backgroundColor: t.color + '22', color: t.color, border: `1px solid ${t.color}44` }}
    >
      {t.name}
    </span>
  )
}
