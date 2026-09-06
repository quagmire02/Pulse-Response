"use client"

import { useFormStatus } from "react-dom"
import CreatePharmacistSubmitButton from "@/components/buttons/CreatePharmacistSubmitButton"
import styles from "./PharmacistForm.module.css"

function SubmitButton({ loading, submitButtonText }) {
  const { pending } = useFormStatus()

  return (
    <CreatePharmacistSubmitButton disabled={loading || pending} loading={loading || pending}>
      {loading || pending ? "Processing..." : submitButtonText}
    </CreatePharmacistSubmitButton>
  )
}

export default function PharmacistForm({
  onSubmit,
  loading = false,
  errors = {},
  submitButtonText = "Submit",
  initialData = null,
}) {
  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const isConsultation = formData.has('is_consultation');
    formData.set('is_consultation', isConsultation);
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={initialData?.user?.email || ""}
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            required
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            defaultValue={initialData?.user?.username || ""}
            className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
          />
          {errors.username && <span className={styles.error}>{errors.username}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="first_name" className={styles.label}>
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            defaultValue={initialData?.user?.first_name || ""}
            className={`${styles.input} ${errors.first_name ? styles.inputError : ""}`}
          />
          {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="last_name" className={styles.label}>
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            defaultValue={initialData?.user?.last_name || ""}
            className={`${styles.input} ${errors.last_name ? styles.inputError : ""}`}
          />
          {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="license_num" className={styles.label}>
            License Number
          </label>
          <input
            type="number"
            id="license_num"
            name="license_num"
            defaultValue={initialData?.license_num || ""}
            className={`${styles.input} ${errors.license_num ? styles.inputError : ""}`}
          />
          {errors.license_num && <span className={styles.error}>{errors.license_num}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="speciality" className={styles.label}>
            Speciality
          </label>
          <input
            type="text"
            id="speciality"
            name="speciality"
            defaultValue={initialData?.speciality || ""}
            className={`${styles.input} ${errors.speciality ? styles.inputError : ""}`}
          />
          {errors.speciality && <span className={styles.error}>{errors.speciality}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="address" className={styles.label}>
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows="3"
          defaultValue={initialData?.user?.address || ""}
          className={`${styles.textarea} ${errors.address ? styles.inputError : ""}`}
        />
        {errors.address && <span className={styles.error}>{errors.address}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="bio" className={styles.label}>
          Biography
        </label>
        <textarea
          id="bio"
          name="bio"
          rows="4"
          defaultValue={initialData?.bio || ""}
          className={`${styles.textarea} ${errors.bio ? styles.inputError : ""}`}
        />
        {errors.bio && <span className={styles.error}>{errors.bio}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="is_consultation"
            defaultChecked={initialData?.is_consultation || false}
            className={styles.checkbox}
          />
          Available for consultation
        </label>
        {errors.is_consultation && <span className={styles.error}>{errors.is_consultation}</span>}
      </div>

      {!initialData && (
        <>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                required={!initialData}
              />
              {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password_confirmation" className={styles.label}>
                Confirm Password *
              </label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                className={`${styles.input} ${errors.password_confirmation ? styles.inputError : ""}`}
                required={!initialData}
              />
              {errors.password_confirmation && <span className={styles.error}>{errors.password_confirmation}</span>}
            </div>
          </div>
        </>
      )}

      {errors.error && (
        <div className={styles.generalError}>
          {typeof errors.error === "object" ? JSON.stringify(errors.error) : errors.error}
        </div>
      )}

      <div className={styles.submitSection}>
        <SubmitButton loading={loading} submitButtonText={submitButtonText} />
      </div>
    </form>
  )
}
