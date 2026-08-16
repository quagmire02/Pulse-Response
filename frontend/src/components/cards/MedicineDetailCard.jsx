"use client"

import { useState } from "react"
import {AddToCartButton} from "@/components/buttons/buttons"
import styles from "./MedicineDetailCard.module.css"

export default function MedicineDetailCard({ medicine, onUpdate, onDelete, isAdmin = false }) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = medicine.image_url
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${medicine.image_url}`
    : "/placeholder.svg?height=200&width=200&query=medicine";

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        {!imageError ? (
          <img
            src={imageUrl}
            alt={medicine.name}
            className={styles.image}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>No Image</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.name}>{medicine.name}</h2>
          <div className={styles.price}>${medicine.price}</div>
        </div>

        <p className={styles.description}>{medicine.description}</p>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Dosage:</span>
            <span className={styles.value}>{medicine.dosage}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Brand:</span>
            <span className={styles.value}>{medicine.brand}</span>
          </div>
        </div>
        {medicine.generic_name && (
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Generic Name:</span>
              <span className={styles.value}>{medicine.generic_name}</span>
            </div>
          </div>
        )}
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Stock:</span>
            <span className={styles.value}>{medicine.stock}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Available:</span>
            <span className={`${styles.value} ${medicine.stock > 0 ? styles.available : styles.unavailable}`}>
              {medicine.stock > 0 ? "Yes" : "No"}
            </span>
          </div>
        </div>
        <div className={styles.detailsBig}>
          {medicine.categories && medicine.categories.length > 0 && (
            <div className={styles.detailItem}>
              <span className={styles.label}>Category: </span>
              <span className={styles.category}>
              {medicine.categories.map((category, index) => (
                <div key={category.id}>
                  {category.name}
                  {index < medicine.categories.length - 1 && ", "}
                </div>
                ))}
              </span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {isAdmin ? (
            <>
              <button onClick={onUpdate} className={styles.updateButton}>
                Update Medicine
              </button>
              <button onClick={onDelete} className={styles.deleteButton}>
                Delete Medicine
              </button>
            </>
          ) : (
            <AddToCartButton medicineId={medicine.id} isAvailable={medicine.stock > 0} stock={medicine.stock} />
          )}
        </div>
      </div>
    </div>
  )
}

