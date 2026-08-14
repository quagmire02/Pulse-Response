"use client"

import styles from "./NotificationCard.module.css"

export default function NotificationCard({ notification, onClick }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={`${styles.card} ${!notification.is_read ? styles.unread : ""}`} onClick={onClick}>
      <div className={styles.header}>
        <h3 className={styles.subject}>{notification.subject}</h3>
        {!notification.is_read && <div className={styles.unreadIndicator}></div>}
      </div>

      <p className={styles.message}>{notification.message}</p>

      <div className={styles.footer}>
        <span className={styles.date}>{formatDate(notification.created_at)}</span>
      </div>
    </div>
  )
}
