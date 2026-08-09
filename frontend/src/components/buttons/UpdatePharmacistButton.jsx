"use client"

import styles from "./UpdatePharmacistButton.module.css"

export default function UpdatePharmacistButton({ onClick, disabled = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles.button}>
      Update
    </button>
  )
}
