"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAvailableNotificationAction } from "@/actions/notificationsActions"
import styles from "./NotificationBell.module.css"

const POLL_INTERVAL_MS = 30000

export default function NotificationBell() {
  const router = useRouter()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const result = await getAvailableNotificationAction()
      if (cancelled || result.error) return

      const count =
        typeof result.data?.unread_count === "number"
          ? result.data.unread_count
          : result.data?.is_read === false
          ? 1
          : 0

      setUnread(count)
    }

    check()
    const poll = setInterval(check, POLL_INTERVAL_MS)

    const onChanged = () => check()
    window.addEventListener("notifications-changed", onChanged)

    return () => {
      cancelled = true
      clearInterval(poll)
      window.removeEventListener("notifications-changed", onChanged)
    }
  }, [])

  return (
    <button
      className={styles.bellButton}
      onClick={() => router.push("/notification")}
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      title={unread > 0 ? `${unread} unread` : "Notifications"}
    >
      <svg
        className={styles.bellIcon}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {unread > 0 && (
        <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>
      )}
    </button>
  )
}
