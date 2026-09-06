"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "@/actions/authActions"
import {LoginButton} from "@/components/buttons/buttons"
import styles from "./LoginForm.module.css"

export default function LoginForm() {
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (formData) => {
    setErrors({})
    setSuccess("")

    try {
      const result = await loginAction(formData)

      if (result.success) {
        setSuccess(result.success)
        setErrors({})

        setTimeout(() => {
          router.push("/")
        }, 1500)
      } else if (result.error && typeof result.error === "object") {
        // Field level validation, e.g. { email: ["..."] }
        setErrors(result.error)
      } else {
        // A plain string reason such as "Credentials are incorrect." or the
        // approval notice for a licensed role that has not been approved yet.
        setErrors({ error: result.error || result.errors || "Login failed. Please try again." })
      }
    } catch (err) {
      setErrors({ error: "An unexpected error occurred. Please try again." })
    }
  }

  return (
    <div className={styles.formContainer}>
      <form action={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={styles.input}
            placeholder="Enter your email"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className={styles.input}
            placeholder="Enter your password"
          />
        </div>

        {errors.email && <div className={`${styles.message} ${styles.error}`}>{errors.email[0]}</div>}
        {errors.error && <div className={`${styles.message} ${styles.error}`}>{errors.error}</div>}
        {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}

        <LoginButton />

      </form>
    </div>

  )
}
