"use client"

import { useState } from "react"
import { createFeedbackAction } from "@/actions/feedbackActions"
import {AddFeedbackSubmitButton} from "@/components/buttons/buttons"
import styles from "./AddFeedbackForm.module.css"

export default function AddFeedbackForm({ medicineId, onSuccess, onCancel }) {
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")

  const handleSubmit = async (formData) => {
    setErrors({})
    setSuccess("")

    formData.append("medicine_id", medicineId)

    const result = await createFeedbackAction(formData)

    if (result.error) {
      setErrors(result.error)
    } else if (result.success) {
      setSuccess("Feedback added successfully!")
      setTimeout(() => {
        onSuccess()
      }, 1000)
    }
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="comment" className={styles.label}>
          Your Feedback *
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className={`${styles.textarea} ${errors.comment ? styles.inputError : ""}`}
          placeholder="Share your thoughts about this medicine item..."
          required
        />
        {errors.comment && <span className={styles.error}>{errors.comment}</span>}
      </div>

      {errors.error && <div className={styles.generalError}>{errors.error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.buttonGroup}>
        <AddFeedbackSubmitButton />
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </form>
  )
}
