import LoginForm from "@/components/forms/LoginForm"
import styles from "./page.module.css"

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Please sign in to your account</p>
        </div>
        <LoginForm />
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Don't have an account?{" "}
            <a href="/auth/signup" className={styles.link}>
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
