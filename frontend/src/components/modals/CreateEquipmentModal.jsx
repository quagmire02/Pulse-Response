"use client"

import { useState, useEffect } from "react"
import { createEquipmentAction } from "@/actions/equipmentActions"
import { getVendorsAction } from "@/actions/vendorActions"
import styles from "./CreateEquipmentModal.module.css"

export default function CreateEquipmentModal({ onClose, onSuccess, userRole, initialVendorId = null }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState("")
  const [vendors, setVendors] = useState([])
  const isAdmin = userRole === "admin" || userRole === "super_admin"

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price_per_day: "",
    size: "",
    quantity: "",
    safety_rules: "",
    condition: "new",
    vendor_id: initialVendorId || "",
  })
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    if (isAdmin && !initialVendorId) {
      const fetchVendors = async () => {
        const result = await getVendorsAction({ per_page: 100 })
        if (!result.error) {
          setVendors(result.data || [])
        }
      }
      fetchVendors()
    }
  }, [isAdmin, initialVendorId])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccessMsg("")

    const submissionData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "") submissionData.append(key, value)
    })
    if (imageFile) {
      submissionData.append("image", imageFile)
    }

    try {
      const result = await createEquipmentAction(submissionData)
      if (result.error) {
        setErrors(result.error)
      } else {
        setSuccessMsg(result.success || "Equipment added successfully!")
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setErrors({ error: "Failed to create equipment listing." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Equipment Listing</h2>
          <button type="button" onClick={onClose} className={styles.closeBtn} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {successMsg && <div className={styles.success}>{successMsg}</div>}
          {errors.error && <div className={styles.error}>{errors.error}</div>}

          {isAdmin && !initialVendorId && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Vendor *</label>
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.company_name} ({v.user?.username})
                  </option>
                ))}
              </select>
              {errors.vendor_id && <span className={styles.fieldError}>{errors.vendor_id}</span>}
            </div>
          )}

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Equipment Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. oxygen, vaccine, mobility"
                className={styles.input}
                required
              />
              {errors.category && <span className={styles.fieldError}>{errors.category}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Price per Day ($) *</label>
              <input
                type="number"
                step="0.01"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.price_per_day && <span className={styles.fieldError}>{errors.price_per_day}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={styles.input}
                required
              />
              {errors.quantity && <span className={styles.fieldError}>{errors.quantity}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
              {errors.condition && <span className={styles.fieldError}>{errors.condition}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Size / Dimensions</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="e.g. Medium, 50 Liters, 10x10x10"
                className={styles.input}
              />
              {errors.size && <span className={styles.fieldError}>{errors.size}</span>}
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
            {errors.description && <span className={styles.fieldError}>{errors.description}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Safety Rules</label>
            <textarea
              name="safety_rules"
              value={formData.safety_rules}
              onChange={handleChange}
              placeholder="List rules or safety instructions..."
              className={styles.textarea}
              rows="3"
            ></textarea>
            {errors.safety_rules && <span className={styles.fieldError}>{errors.safety_rules}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Equipment Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            {errors.image && <span className={styles.fieldError}>{errors.image}</span>}
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Adding..." : "Add Equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
