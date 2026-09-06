"use client"

import { useState } from "react"
import { updateMedicineAction, getMedicineAction } from "@/actions/medicineActions"
import UpdateMedicineForm from "@/components/forms/UpdateMedicineForm"
import styles from "./UpdateMedicineModal.module.css"

export default function UpdateMedicineModal({ isOpen, onClose, medicine, categories, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (formData) => {
    setLoading(true)
    setErrors({})
    setSuccessMessage("")

    try {
      const result = await updateMedicineAction(medicine.id, formData)

      if (result.error) {
        setErrors(result.error)
      } else if (result.success) {
        setSuccessMessage("Medicine updated successfully!")

        const updatedMedicineResponse = await getMedicineAction(medicine.id)
        if (updatedMedicineResponse.data) {
          setTimeout(() => {
            onSuccess(updatedMedicineResponse.data)
          }, 1500)
        }
      }
    } catch (err) {
      setErrors({ error: "Failed to update medicine" })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Update Medicine</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <UpdateMedicineForm
            onSubmit={handleSubmit}
            medicine={medicine}
            categories={categories}
            loading={loading}
            errors={errors}
            successMessage={successMessage}
          />
        </div>
      </div>
    </div>
  )
}
