"use client"

import { useState } from "react"
import {SignupButton} from "@/components/buttons/buttons"
import { createSignupRequestAction } from "@/actions/signupRequestActions"
import { SIGNUP_ROLES, PHARMACIST_ROLES } from "@/libs/roles"
import styles from "./SignupForm.module.css"


export default function SignupForm() {

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")
  const [role, setRole] = useState("user")

  const needsPharmacistFields = PHARMACIST_ROLES.includes(role)
  const needsVendorFields = role === "vendor"
  const needsLicense = needsPharmacistFields || needsVendorFields
  const selectedRole = SIGNUP_ROLES.find((option) => option.value === role)

  const handleSubmit = async (formData) => {
    setErrors({})
    setSuccess("")

    const result = await createSignupRequestAction(formData)

    if (result.error) {
      setErrors(result.error)
    } else if (result.success) {
      setSuccess(result.success)
    }
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="role" className={styles.label}>
          Account Type *
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`${styles.select} ${errors.role ? styles.inputError : ""}`}
          required
        >
          {SIGNUP_ROLES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {selectedRole && <span className={styles.hint}>{selectedRole.description}</span>}
        {errors.role && <span className={styles.error}>{errors.role}</span>}
      </div>

      <div className={styles.notice}>
        Every account is reviewed by an admin. You will be able to log in once your request is approved.
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
          required
        />
        {errors.email && <span className={styles.error}>{errors.email}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="username" className={styles.label}>
          Username *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
          required
        />
        {errors.username && <span className={styles.error}>{errors.username}</span>}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formCol}>
          <label htmlFor="first_name" className={styles.label}>
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            className={`${styles.input} ${errors.first_name ? styles.inputError : ""}`}
          />
          {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
        </div>

        <div className={styles.formCol}>
          <label htmlFor="last_name" className={styles.label}>
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            className={`${styles.input} ${errors.last_name ? styles.inputError : ""}`}
          />
          {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="address" className={styles.label}>
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
        />
        {errors.address && <span className={styles.error}>{errors.address}</span>}
      </div>

      {needsLicense && (
        <div className={styles.formGroup}>
          <label htmlFor="license_num" className={styles.label}>
            License Number *
          </label>
          <input
            type="text"
            id="license_num"
            name="license_num"
            className={`${styles.input} ${errors.license_num ? styles.inputError : ""}`}
            required
          />
          {errors.license_num && <span className={styles.error}>{errors.license_num}</span>}
        </div>
      )}

      {needsPharmacistFields && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="speciality" className={styles.label}>
              Speciality *
            </label>
            <input
              type="text"
              id="speciality"
              name="speciality"
              placeholder="e.g. Cardiology"
              className={`${styles.input} ${errors.speciality ? styles.inputError : ""}`}
              required
            />
            {errors.speciality && <span className={styles.error}>{errors.speciality}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio" className={styles.label}>
              Short Bio *
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              className={`${styles.textarea} ${errors.bio ? styles.inputError : ""}`}
              required
            />
            {errors.bio && <span className={styles.error}>{errors.bio}</span>}
          </div>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="is_consultation" defaultChecked />
            Available for online consultations
          </label>
        </>
      )}

      {needsVendorFields && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="company_name" className={styles.label}>
              Company Name *
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              className={`${styles.input} ${errors.company_name ? styles.inputError : ""}`}
              required
            />
            {errors.company_name && <span className={styles.error}>{errors.company_name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contact_phone" className={styles.label}>
              Contact Phone
            </label>
            <input
              type="text"
              id="contact_phone"
              name="contact_phone"
              className={`${styles.input} ${errors.contact_phone ? styles.inputError : ""}`}
            />
            {errors.contact_phone && <span className={styles.error}>{errors.contact_phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Company Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
            />
            {errors.description && <span className={styles.error}>{errors.description}</span>}
          </div>
        </>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.label}>
          Password *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
          required
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
          required
        />
        {errors.password_confirmation && <span className={styles.error}>{errors.password_confirmation}</span>}
      </div>

      {errors.error && <div className={styles.generalError}>{errors.error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <SignupButton />
    </form>
  )
}
