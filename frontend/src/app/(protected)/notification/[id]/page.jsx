"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getNotificationAction, updateNotificationAction } from "@/actions/notificationsActions"
import NotificationDetailCard from "@/components/cards/NotificationDetailCard"
import styles from "./page.module.css"

export default function NotificationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const notificationId = params.id

  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (notificationId) {
      loadNotification()
      markAsRead()
    }
  }, [notificationId])

  const loadNotification = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getNotificationAction(notificationId)

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Failed to load notification")
      } else {
        setNotification(result.data)
      }
    } catch (err) {
      setError("Failed to load notification")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await updateNotificationAction(notificationId)
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleBackClick = () => {
    router.push("/notification")
  }

  const handleDeleteSuccess = () => {
    router.push("/notification")
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button className={styles.backButton} onClick={handleBackClick}>
          ← Back to Notifications
        </button>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading notification...</div>
        ) : notification ? (
          <NotificationDetailCard notification={notification} onDeleteSuccess={handleDeleteSuccess} />
        ) : (
          <div className={styles.notFound}>Notification not found</div>
        )}
      </div>
    </div>
  )
}
