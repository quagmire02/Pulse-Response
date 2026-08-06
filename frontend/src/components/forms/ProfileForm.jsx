"use client"

import { useState } from "react"
import { updateUserAction } from "@/actions/userActions"
import {UpdateButton} from "@/components/buttons/buttons"
import {DeleteButton} from "@/components/buttons/buttons"
import DeleteModal from "@/components/modals/DeleteModal"
import styles from "./ProfileForm.module.css"

export default function ProfileForm({ userData, userId, onUserUpdate }) {
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrors({})
    setSuccess("")

    const formData = new FormData(event.target)
    const result = await updateUserAction(userId, formData)

    if (result.error) {
      if (typeof result.error === "object") {
        setErrors(result.error)
      } else {
        setErrors({ general: result.error })
      }
    } else if (result.success) {
      setSuccess("Profile updated successfully!")
      onUserUpdate()
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Profile</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {errors.general && <div className={styles.errorMessage}>{errors.general}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <div className={styles.field}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={userData.email || ""}
            className={errors.email ? styles.errorInput : ""}
          />
          {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            defaultValue={userData.username || ""}
            className={errors.username ? styles.errorInput : ""}
          />
          {errors.username && <span className={styles.fieldError}>{errors.username}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="first_name">First Name:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            defaultValue={userData.first_name || ""}
            className={errors.first_name ? styles.errorInput : ""}
          />
          {errors.first_name && <span className={styles.fieldError}>{errors.first_name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="last_name">Last Name:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            defaultValue={userData.last_name || ""}
            className={errors.last_name ? styles.errorInput : ""}
          />
          {errors.last_name && <span className={styles.fieldError}>{errors.last_name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">New Password (optional):</label>
          <input type="password" id="password" name="password" className={errors.password ? styles.errorInput : ""} />
          {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password_confirmation">Confirm Password:</label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            className={errors.password_confirmation ? styles.errorInput : ""}
          />
          {errors.password_confirmation && <span className={styles.fieldError}>{errors.password_confirmation}</span>}
        </div>

        <div className={styles.buttons}>
          <UpdateButton />
          <DeleteButton onClick={handleDeleteClick} />
        </div>
      </form>

      {showDeleteModal && <DeleteModal userId={userId} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />}
    </div>
  )
}
