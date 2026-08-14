"use client"

import Link from "next/link"
import styles from "./DeliverCard.module.css"

export default function DeliverCard({ delivery }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return styles.statusDelivered
      case "processing":
        return styles.statusProcessing
      case "failed":
        return styles.statusFailed
      default:
        return styles.statusDefault
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "emergency":
        return styles.typeEmergency
      case "basic":
        return styles.typeBasic
      default:
        return styles.typeDefault
    }
  }

  return (
    <Link href={`/deliver/${delivery.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.orderId}>Order #{delivery.order_id}</h3>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${getStatusColor(delivery.delivery_status)}`}>
              {delivery.delivery_status}
            </span>
            <span className={`${styles.badge} ${getTypeColor(delivery.delivery_type)}`}>{delivery.delivery_type}</span>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.trackingInfo}>
            <span className={styles.label}>Tracking Number:</span>
            <span className={styles.value}>{delivery.track_num}</span>
          </div>

          {delivery.order && (
            <div className={styles.orderInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Total Amount:</span>
                <span className={styles.value}>${delivery.order.total_amount}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Order Status:</span>
                <span className={styles.value}>{delivery.order.order_status}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.viewDetails}>View Details →</span>
        </div>
      </div>
    </Link>
  )
}
