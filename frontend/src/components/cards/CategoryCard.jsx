"use client"

import {RemoveButton} from "@/components/buttons/buttons"
import styles from "./CategoryCard.module.css"

export default function CategoryCard({ category, onDelete }) {
  const handleDeleteClick = (e) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div className={styles.card}>
      <div className={styles.deleteButton}>
        <RemoveButton onClick={handleDeleteClick} />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{category.name}</h3>
        <div className={styles.id}>ID: {category.id}</div>
      </div>
    </div>
  )
}
