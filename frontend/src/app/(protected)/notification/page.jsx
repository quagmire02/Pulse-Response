"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getNotificationsAction } from "@/actions/notificationsActions"
import NotificationCard from "@/components/cards/NotificationCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

export default function NotificationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentPage = searchParams.get("page") || "1"

  useEffect(() => {
    loadNotifications()
  }, [searchParams])

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = {}

      if (currentPage && currentPage !== "1") {
        queryParams.page = currentPage
      }

      const result = await getNotificationsAction(queryParams)

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Failed to load notifications")
      } else {
        setNotifications(result.data || [])
        setPagination(result.pagination)
      }
    } catch (err) {
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams)
    if (page === 1) {
      params.delete("page")
    } else {
      params.set("page", page.toString())
    }
    router.push(`/notification?${params.toString()}`)
  }

  const handleNotificationClick = (notificationId) => {
    router.push(`/notification/${notificationId}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Notifications</h1>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading notifications...</div>
        ) : (
          <>
            <div className={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                ))
              ) : (
                <div className={styles.noResults}>No notifications found</div>
              )}
            </div>

            {pagination && notifications.length > 0 && (
              <Pagination
                currentPage={Number.parseInt(currentPage)}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
