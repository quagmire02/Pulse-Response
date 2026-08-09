"use client"

import styles from "./CreatePharmacistButton.module.css"

export default function CreatePharmacistButton({ onClick, disabled = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles.button}>
      Create Pharmacist
    </button>
  )
}
