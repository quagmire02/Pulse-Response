"use client"

import { useState, useEffect, useCallback } from "react"
import { TOAST_EVENT, TOAST_DURATION_MS } from "@/libs/toast"
import styles from "./ToastHost.module.css"

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const onToast = (event) => {
      const toast = event.detail
      if (!toast?.message) return

      setToasts((current) => {
        const next = [...current, toast]
        return next.slice(-3)
      })

      setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS)
    }

    window.addEventListener(TOAST_EVENT, onToast)
    return () => window.removeEventListener(TOAST_EVENT, onToast)
  }, [dismiss])

  if (toasts.length === 0) return null

  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.tone] || styles.success}`}>
          <span className={styles.mark} aria-hidden="true">
            {toast.tone === "error" ? "!" : toast.tone === "info" ? "i" : "✓"}
          </span>
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
