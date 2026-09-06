"use client"

import styles from "./DeleteButton.module.css"

export default function DeleteButton({ onClick, disabled = false, children = "Delete" }) {
  return (
    <button className={styles.deleteButton} onClick={onClick} disabled={disabled} type="button">
      {disabled ? "Deleting..." : children}
    </button>
  )
}
