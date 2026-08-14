"use client"

import { useState } from "react"
import { createVendorAction } from "@/actions/vendorActions"
import styles from "./CreateVendorModal.module.css"

export default function CreateVendorModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState("")

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    company_name: "",
    license_num: "",
    first_name: "",
    last_name: "",
    address: "",
    description: "",
    contact_phone: "",
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccessMsg("")

    const submissionData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value) submissionData.append(key, value)
    })

    try {
      const result = await createVendorAction(submissionData)
      if (result.error) {
        setErrors(result.error)
      } else {
        setSuccessMsg(result.success || "Vendor created successfully!")
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setErrors({ error: "Failed to create vendor." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Vendor Account</h2>
          <button type="button" onClick={onClose} className={styles.closeBtn} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {successMsg && <div className={styles.success}>{successMsg}</div>}
          {errors.error && <div className={styles.error}>{errors.error}</div>}

          <div className={styles.sectionTitle}>Account Information</div>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.username && <span className={styles.fieldError}>{errors.username}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password *</label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.password_confirmation && (
                <span className={styles.fieldError}>{errors.password_confirmation}</span>
              )}
            </div>
          </div>

          <div className={styles.sectionTitle}>Company Information</div>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Company Name *</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.company_name && <span className={styles.fieldError}>{errors.company_name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>License Number *</label>
              <input
                type="text"
                name="license_num"
                value={formData.license_num}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.license_num && <span className={styles.fieldError}>{errors.license_num}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Phone</label>
              <input
                type="text"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className={styles.input}
              />
              {errors.contact_phone && <span className={styles.fieldError}>{errors.contact_phone}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              rows="3"
            ></textarea>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Creating..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
