"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {AddToCartButton} from "@/components/buttons/buttons"
import styles from "./MedicineCard.module.css"

export default function MedicineCard({ medicine }) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const imageUrl = medicine.image_url
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${medicine.image_url}`
    : "/placeholder.svg?height=200&width=200&query=medicine";

  const handleCardClick = (e) => {
    if (e.target.closest("button")) {
      return
    }
    router.push(`/medicines/${medicine.id}`)
  }

  const formatPrice = (price) => {
    return `$${Number.parseFloat(price).toFixed(2)}`
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
        {medicine.stock <= 0 && <div className={styles.unavailableBadge}>Unavailable</div>}
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{medicine.name}</h3>
        <p className={styles.description}>{medicine.description}</p>

        <div className={styles.details}>
          <div className={styles.price}>{formatPrice(medicine.price)}</div>
          <div className={styles.stock}>Stock: {medicine.stock}</div>
        </div>

        <div className={styles.actions}>
          <AddToCartButton medicineId={medicine.id} isAvailable={medicine.stock > 0} disabled={medicine.stock <= 0} />
        </div>
      </div>
    </div>
  )
}
