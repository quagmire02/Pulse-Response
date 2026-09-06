import Link from "next/link"
import { RentEquipmentButton } from "@/components/buttons/buttons"
import { equipmentImage } from "@/libs/images"
import styles from "./EquipmentCard.module.css"

export default function EquipmentCard({ equipment, canRent = false }) {
  const inStock = equipment.is_available && equipment.quantity > 0

  // Listings can be rent-only, sale-only, or both. Say which up front instead
  // of leaving the shopper to guess from the prices.
  const forRent = Boolean(equipment.is_for_rent)
  const forSale = Boolean(equipment.is_for_sale) && equipment.sale_price !== null

  const offerLabel = forRent && forSale ? "Rent or Buy" : forSale ? "For Sale" : "For Rent"
  const actionLabel = forRent && forSale ? "Rent or Buy" : forSale ? "Buy Now" : "Rent Now"

  return (
    <Link href={`/equipment/${equipment.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        {equipment.image && (
          <img
            src={equipmentImage(equipment)}
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

          <div className={styles.metaRow}>
            <span className={styles.category}>{equipment.category}</span>
            <span className={`${styles.offerBadge} ${forSale && forRent ? styles.offerBoth : forSale ? styles.offerSale : styles.offerRent}`}>
              {offerLabel}
            </span>
          </div>

          <div className={styles.priceRow}>
            {forRent && (
              <span className={styles.priceBlock}>
                <span className={styles.priceLabel}>Rent</span>
                <span className={styles.priceValue}>${equipment.price_per_day}<small>/day</small></span>
              </span>
            )}
            {forSale && (
              <span className={styles.priceBlock}>
                <span className={styles.priceLabel}>Buy</span>
                <span className={styles.priceValue}>${equipment.sale_price}</span>
              </span>
            )}
          </div>

          <div className={styles.details}>
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
                isAvailable={inStock}
                label={actionLabel}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
