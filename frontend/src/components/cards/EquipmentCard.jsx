import Link from "next/link"
import { RentEquipmentButton } from "@/components/buttons/buttons"
import styles from "./EquipmentCard.module.css"

export default function EquipmentCard({ equipment, canRent = false }) {
  const isRentable = equipment.is_available && equipment.quantity > 0

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
            {equipment.is_for_rent && <span><strong>Rent:</strong> ${equipment.price_per_day}/day</span>}
            {equipment.is_for_sale && equipment.sale_price !== null && (
              <span><strong>Buy:</strong> ${equipment.sale_price}</span>
            )}
            <span><strong>Qty:</strong> {equipment.quantity}</span>
            <span><strong>Condition:</strong> {equipment.condition}</span>
            {equipment.size && <span><strong>Size:</strong> {equipment.size}</span>}
          </div>

          {equipment.vendor && (
            <div className={styles.vendor}>
              By: {equipment.vendor.company_name}
            </div>
          )}

          {canRent && (
            <div className={styles.actions}>
              <RentEquipmentButton
                equipmentId={equipment.id}
                isAvailable={isRentable}
                label={equipment.is_for_sale && !equipment.is_for_rent ? "Buy Now" : "Rent or Buy"}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
