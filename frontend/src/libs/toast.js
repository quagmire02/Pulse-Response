"use client"

export const TOAST_EVENT = "pr-toast"

export const TOAST_DURATION_MS = 5000

export function showToast(message, tone = "success") {
  if (typeof window === "undefined" || !message) return

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message: String(message), tone, id: `${Date.now()}-${Math.random()}` },
    })
  )
}

export const toastSuccess = (message) => showToast(message, "success")
export const toastError = (message) => showToast(message, "error")
export const toastInfo = (message) => showToast(message, "info")
