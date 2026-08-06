import SignupForm from "@/components/forms/SignupForm"
import styles from "./page.module.css"

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Staff Account</h1>
        </div>

        <SignupForm />

        <div className={styles.footer}>
          <p className={styles.footerText}>
            <a href="/admin-dashboard" className={styles.link}>
              Back to Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
