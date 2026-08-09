import styles from "./CreatePharmacistSubmitButton.module.css"

export default function CreatePharmacistSubmitButton({ children, disabled = false, loading = false }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`${styles.button} ${loading ? styles.loading : ""}`}
    >
      {children}
    </button>
  )
}
