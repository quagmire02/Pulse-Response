"use client"

import { useState } from "react"
import styles from "./DeleteModal.module.css"

export default function DeleteGenModal({ title, message, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleYes = async () => {
    setIsDeleting(true)
    onConfirm()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.buttons}>
          <button onClick={handleYes} disabled={isDeleting} className={styles.yesButton}>
            {isDeleting ? "Deleting..." : "Yes"}
          </button>
          <button onClick={onCancel} disabled={isDeleting} className={styles.noButton}>
            No
          </button>
        </div>
      </div>
    </div>
  )
}

