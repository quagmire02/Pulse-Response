"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteUserAction } from "@/actions/userActions"
import styles from "./DeleteModal.module.css"

export default function DeleteModal({ userId, onConfirm, onCancel }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleYes = async () => {
    setIsDeleting(true)
    setError("")

    try {
      const result = await deleteUserAction(userId)

      if (result.success) {
        onConfirm()
        router.push("/auth/login")
      } else if (result.error) {
        setError("Failed to delete account")
        setIsDeleting(false)
      }
    } catch (err) {
      setError("Failed to delete account")
      setIsDeleting(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Delete Account</h3>
        <p>Are you sure you want to delete your account?</p>

        {error && <div className={styles.error}>{error}</div>}

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

