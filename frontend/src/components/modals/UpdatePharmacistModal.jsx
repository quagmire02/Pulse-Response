"use client"

import { useState } from "react"
import PharmacistForm from "@/components/forms/PharmacistForm"
import { updatePharmacistAction } from "@/actions/pharmacistActions"
import styles from "./UpdatePharmacistModal.module.css"

export default function UpdatePharmacistModal({ pharmacist, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (formData) => {
    setLoading(true)
    setErrors({})
    setSuccessMessage("")

    try {
      const result = await updatePharmacistAction(pharmacist.user_id, formData)

      if (result.error) {
        setErrors(result.error)
      } else {
        setSuccessMessage("Pharmacist updated successfully!")
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setErrors({ error: "Failed to update pharmacist" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Update Pharmacist</h2>
          <button type="button" onClick={onClose} className={styles.closeButton} disabled={loading}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <PharmacistForm
            onSubmit={handleSubmit}
            loading={loading}
            errors={errors}
            submitButtonText="Update Pharmacist"
            initialData={pharmacist}
          />
        </div>
      </div>
    </div>
  )
}
