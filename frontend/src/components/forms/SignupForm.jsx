"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {SignupButton} from "@/components/buttons/buttons"
import { createUserAction } from "@/actions/userActions"
import styles from "./SignupForm.module.css"


export default function SignupForm() {

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (formData) => {
    setErrors({})
    setSuccess("")

    const result = await createUserAction(formData)

    if (result.error) {
      setErrors(result.error)
    } else if (result.success) {
      setSuccess("Account created successfully! Redirecting to login...")
      setTimeout(() => {
        router.push("/auth/login")
      }, 1000)
    }
  }

  return (
    <form action={handleSubmit} className={styles.form}>
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
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
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
