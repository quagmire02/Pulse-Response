"use client"

import styles from "./Charts.module.css"

// Shared categorical palette. Ordered so the first two series stay readable
// side by side, which is the common case (sales vs rentals, medicines vs equipment).
const PALETTE = [
  "#0b79d4",
  "#12a594",
  "#e08700",
  "#7b61c9",
  "#c0392b",
  "#4b7a8f",
]

export const chartColor = (index) => PALETTE[index % PALETTE.length]

const formatValue = (value, prefix = "", suffix = "") =>
  `${prefix}${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: prefix === "$" ? 2 : 0,
    maximumFractionDigits: 2,
  })}${suffix}`

/**
 * Horizontal percentage bars. Used wherever a set of parts should be read as
 * shares of a whole, e.g. spend split across medicines and equipment.
 */
export function ShareBars({ data = [], valuePrefix = "", emptyMessage = "No data yet" }) {
  if (!data.length || data.every((row) => !row.value)) {
    return <p className={styles.empty}>{emptyMessage}</p>
  }

  return (
    <div className={styles.shareBars}>
      {data.map((row, index) => (
        <div key={row.label} className={styles.shareRow}>
          <div className={styles.shareHeader}>
            <span className={styles.shareLabel}>{row.label}</span>
            <span className={styles.shareValue}>
              {formatValue(row.value, valuePrefix)}
              <span className={styles.sharePercent}>{row.percentage}%</span>
            </span>
          </div>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{ width: `${Math.max(row.percentage, 0)}%`, background: chartColor(index) }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Donut showing the same share data as a single composed figure. Rendered with
 * stroke-dasharray so no charting library is needed.
 */
export function DonutChart({ data = [], valuePrefix = "", centerLabel = "Total" }) {
  const total = data.reduce((sum, row) => sum + Number(row.value ?? 0), 0)

  if (!total) {
    return <p className={styles.empty}>No data yet</p>
  }

  const radius = 70
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className={styles.donutWrapper}>
      <svg viewBox="0 0 200 200" className={styles.donut} role="img" aria-label={`${centerLabel} breakdown`}>
        <g transform="rotate(-90 100 100)">
          {data.map((row, index) => {
            const fraction = Number(row.value ?? 0) / total
            const length = fraction * circumference
            const circle = (
              <circle
                key={row.label}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={chartColor(index)}
                strokeWidth="26"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            )
            offset += length
            return circle
          })}
        </g>
        <text x="100" y="94" textAnchor="middle" className={styles.donutTotal}>
          {formatValue(total, valuePrefix)}
        </text>
        <text x="100" y="114" textAnchor="middle" className={styles.donutCaption}>
          {centerLabel}
        </text>
      </svg>

      <ul className={styles.legend}>
        {data.map((row, index) => (
          <li key={row.label} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: chartColor(index) }} />
            <span className={styles.legendLabel}>{row.label}</span>
            <span className={styles.legendValue}>{row.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Vertical bars for a time series, e.g. the last six months of revenue.
 */
export function TrendBars({ data = [], valuePrefix = "", caption }) {
  const max = Math.max(...data.map((row) => Number(row.value ?? 0)), 0)

  if (!data.length || max === 0) {
    return <p className={styles.empty}>No activity recorded in this period</p>
  }

  return (
    <div className={styles.trend}>
      <div className={styles.trendBars}>
        {data.map((row) => {
          const height = max > 0 ? (Number(row.value ?? 0) / max) * 100 : 0
          return (
            <div key={row.label} className={styles.trendColumn}>
              <span className={styles.trendValue}>{formatValue(row.value, valuePrefix)}</span>
              <div className={styles.trendTrack}>
                <div
                  className={styles.trendFill}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${row.label}: ${formatValue(row.value, valuePrefix)}`}
                />
              </div>
              <span className={styles.trendLabel}>{row.label}</span>
            </div>
          )
        })}
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  )
}

/**
 * Compact single-metric tile.
 */
export function StatTile({ label, value, hint }) {
  return (
    <div className={styles.statTile}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {hint && <span className={styles.statHint}>{hint}</span>}
    </div>
  )
}
