"use client"

import { useState } from "react"
import styles from "./DeleteModal.module.css"

export default function DeleteModal({
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
}) {
  const [error, setError] = useState("")

  const handleYes = async () => {
    setError("")
    try {
      await onConfirm()
    } catch (err) {
      setError("An error occurred")
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{title}</h3>
        <p>{message}</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttons}>
          <button onClick={handleYes} disabled={loading} className={styles.yesButton}>
            {loading ? "Processing..." : "Yes"}
          </button>
          <button onClick={onCancel} disabled={loading} className={styles.noButton}>
            No
          </button>
        </div>
      </div>
    </div>
  )
}
