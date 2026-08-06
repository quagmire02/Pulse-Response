"use client"

import { useState } from "react"
import styles from "./CreateCategoryModal.module.css"

export default function CreateCategoryModal({ isOpen, onSubmit, onCancel, loading, error }) {
  const [name, setName] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    const formData = new FormData()
    formData.append("name", name.trim())

    const success = await onSubmit(formData)
    if (success) {
      setName("")
    }
  }

  const handleCancel = () => {
    setName("")
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Category</h2>
          <button type="button" onClick={handleCancel} className={styles.closeButton} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="categoryName" className={styles.label}>
              Category Name
            </label>
            <input
              id="categoryName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className={styles.input}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className={styles.error}>
              {typeof error === "object" ? error.name || error.error || JSON.stringify(error) : error}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton} disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

