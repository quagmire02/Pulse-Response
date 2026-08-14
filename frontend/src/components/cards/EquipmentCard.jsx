import Link from "next/link"
import styles from "./EquipmentCard.module.css"

export default function EquipmentCard({ equipment }) {
  return (
    <Link href={`/equipment/${equipment.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        {equipment.image && (
          <img
            src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${equipment.image}`}
            alt={equipment.name}
            className={styles.image}
          />
        )}
        <div className={styles.body}>
          <div className={styles.header}>
            <h3 className={styles.name}>{equipment.name}</h3>
            <span className={`${styles.badge} ${equipment.is_available ? styles.available : styles.unavailable}`}>
              {equipment.is_available ? "Available" : "Unavailable"}
            </span>
          </div>

          <div className={styles.category}>{equipment.category}</div>

          <div className={styles.details}>
            <span><strong>Price:</strong> ${equipment.price_per_day}/day</span>
            <span><strong>Qty:</strong> {equipment.quantity}</span>
            <span><strong>Condition:</strong> {equipment.condition}</span>
            {equipment.size && <span><strong>Size:</strong> {equipment.size}</span>}
          </div>

          {equipment.vendor && (
            <div className={styles.vendor}>
              By: {equipment.vendor.company_name}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
