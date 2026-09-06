"use client"

import { useState } from "react"
import {RemoveButton} from "@/components/buttons/buttons"
import { medicineImage } from "@/libs/images"
import styles from "./AdminMedicineCard.module.css"

export default function AdminMedicineCard({ medicine, onDelete, onClick }) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = medicineImage(medicine);

  console.log(medicine.image_url)

  const handleCardClick = (e) => {
    if (e.target.closest("button")) {
      return
    }
    onClick()
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.imageContainer}>
        {!imageError ? (
          <img
            src={imageUrl}
            alt={medicine.name}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>No Image</span>
          </div>
        )}
        <div className={styles.deleteButton}>
          <RemoveButton onClick={handleDeleteClick} />
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{medicine.name}</h3>
        <p className={styles.description}>{medicine.description}</p>

        <div className={styles.details}>
          <div className={styles.price}>${Number.parseFloat(medicine.price).toFixed(2)}</div>
          <div className={styles.stock}>Stock: {medicine.stock}</div>
        </div>

        <div className={styles.meta}>
          <span className={styles.id}>ID: {medicine.id}</span>
          <span className={`${styles.availability} ${medicine.stock > 0 ? styles.available : styles.unavailable}`}>
            {medicine.stock > 0 ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>
    </div>
  )
}
