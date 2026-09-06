"use client"

import { useRouter } from "next/navigation"

export function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  showBack = true,
  wide = false,
  children,
}) {
  const router = useRouter()

  return (
    <div className={`pr-page${wide ? " pr-page-wide" : ""}`}>
      <div className="pr-page-head">
        <div>
          {eyebrow && <span className="pr-eyebrow">{eyebrow}</span>}
          <h1 className="pr-title">{title}</h1>
          {subtitle && <p className="pr-subtitle">{subtitle}</p>}
        </div>

        <div className="pr-head-actions">
          {actions}
          {showBack && (
            <button className="pr-btn pr-btn-ghost" onClick={() => router.back()}>
              Back
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

export function Section({ title, hint, actions, children }) {
  return (
    <section className="pr-section">
      {(title || actions) && (
        <div className="pr-page-head" style={{ marginBottom: 14 }}>
          <div>
            {title && <h2 className="pr-section-title">{title}</h2>}
            {hint && <p className="pr-section-hint">{hint}</p>}
          </div>
          {actions && <div className="pr-head-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Alert({ kind = "info", children }) {
  if (!children) return null
  return <div className={`pr-alert pr-alert-${kind}`}>{children}</div>
}

export function EmptyState({ children }) {
  return <div className="pr-empty">{children}</div>
}

export function Loading({ label = "Loading" }) {
  return <div className="pr-loading">{label}</div>
}

export function errorText(error, fallback = "Something went wrong.") {
  if (!error) return ""
  if (typeof error === "string") return error
  if (Array.isArray(error)) return error.join(" ")
  if (typeof error === "object") {
    const flat = Object.values(error).flat()
    return flat.length ? flat.join(" ") : fallback
  }
  return fallback
}
