import Link from "next/link"
import styles from "./VendorCard.module.css"

export default function VendorCard({ vendor }) {
  const ownerName = `${vendor.user?.first_name || ""} ${vendor.user?.last_name || ""}`.trim() || vendor.user?.username || "Unknown Owner"

  return (
    <Link href={`/vendor/${vendor.user_id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>🏪</span>
          </div>
          <div className={styles.titleInfo}>
            <h3 className={styles.companyName}>{vendor.company_name}</h3>
            <span className={styles.license}>Lic: {vendor.license_num}</span>
          </div>
        </div>

        <div className={styles.body}>
          {vendor.description && (
            <p className={styles.description}>{vendor.description}</p>
          )}

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <strong>Owner:</strong> {ownerName}
            </div>
            <div className={styles.detailItem}>
              <strong>Email:</strong> {vendor.user?.email || "N/A"}
            </div>
            {vendor.contact_phone && (
              <div className={styles.detailItem}>
                <strong>Phone:</strong> {vendor.contact_phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
