import { STAT_FIELDS } from '../lib/stats'

export default function StatsBlock({ title, stats, fields }) {
  return (
    <div className="stats-block">
      {title && <h3 className="stats-block-title">{title}</h3>}
      <div className="stats-grid">
        {fields.map((key) => {
          const def = STAT_FIELDS[key]
          if (!def) return null
          const value = stats[key]
          const tone = def.tone ? def.tone(value) : null
          return (
            <div className="stat" key={key}>
              <span className="stat-label">{def.label}</span>
              <span className={`stat-value ${tone ? `tone-${tone}` : ''}`}>
                {def.format(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}