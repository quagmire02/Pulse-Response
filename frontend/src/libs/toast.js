"use client"

/**
 * Success acknowledgements, decoupled from any React context.
 *
 * A window event rather than a provider so any client component can fire one
 * without being wrapped in something, and without every page importing a hook.
 * ToastHost, mounted once in the protected layout, is the only listener.
 */
export const TOAST_EVENT = "pr-toast"

// Long enough to read a sentence, short enough not to sit in the way.
export const TOAST_DURATION_MS = 5000

/**
 * @param {string} message
 * @param {"success"|"error"|"info"} tone
 */
export function showToast(message, tone = "success") {
  if (typeof window === "undefined" || !message) return

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message: String(message), tone, id: `${Date.now()}-${Math.random()}` },
    })
  )
}

/** Convenience wrappers, so call sites read as what they mean. */
export const toastSuccess = (message) => showToast(message, "success")
export const toastError = (message) => showToast(message, "error")
export const toastInfo = (message) => showToast(message, "info")
