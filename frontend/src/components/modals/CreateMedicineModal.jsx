"use client"

import { useState } from "react"
import { createMedicineAction } from "@/actions/medicineActions"
import CreateMedicineForm from "@/components/forms/CreateMedicineForm"
import styles from "./CreateMedicineModal.module.css"

export default function CreateMedicineModal({ isOpen, onClose, categories, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (formData) => {
    setLoading(true);
    setErrors();
    setSuccessMessage("");

    try {
      const result = await createMedicineAction(formData)

      if (result.error) {
        setErrors(result.error)
      } else if (result.success) {
        setSuccessMessage("Medicine created successfully!")
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setErrors({ error: "Failed to create medicine" })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Medicine</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <CreateMedicineForm
            onSubmit={handleSubmit}
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
