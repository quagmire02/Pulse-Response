"use client"

import { useState } from "react"
import { deleteNotificationAction } from "@/actions/notificationsActions"
import DeleteButton from "@/components/buttons/DeleteButton"
import DeleteModal from "@/components/modals/DeleteModal"
import styles from "./NotificationDetailCard.module.css"

export default function NotificationDetailCard({ notification, onDeleteSuccess }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
    setError(null)
    setSuccess(null)
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await deleteNotificationAction(notification.id)

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Failed to delete notification")
      } else {
        setSuccess("Notification deleted successfully")
        setShowDeleteModal(false)
        // Redirect after a short delay
        setTimeout(() => {
          onDeleteSuccess()
        }, 1500)
      }
    } catch (err) {
      setError("Failed to delete notification")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setError(null)
    setSuccess(null)
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.subject}>{notification.subject}</h1>
          <div className={styles.status}>
            <span className={`${styles.statusBadge} ${notification.is_read ? styles.read : styles.unread}`}>
              {notification.is_read ? "Read" : "Unread"}
            </span>
          </div>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>{notification.message}</p>
        </div>

        <div className={styles.metadata}>
          <div className={styles.dates}>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>Created:</span>
              <span className={styles.dateValue}>{formatDate(notification.created_at)}</span>
            </div>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>Updated:</span>
              <span className={styles.dateValue}>{formatDate(notification.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <DeleteButton onClick={handleDeleteClick} disabled={deleting} />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {success && <div className={styles.success}>{success}</div>}
      </div>

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleting}
          title="Delete Notification"
          message="Are you sure you want to delete this notification? This action cannot be undone."
        />
      )}
    </>
  )
}
