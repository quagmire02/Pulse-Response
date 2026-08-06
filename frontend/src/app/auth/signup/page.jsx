import SignupForm from "@/components/forms/SignupForm"
import styles from "./page.module.css"

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join us today and get started</p>
        </div>

        <SignupForm />

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{" "}
            <a href="/auth/login" className={styles.link}>
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
