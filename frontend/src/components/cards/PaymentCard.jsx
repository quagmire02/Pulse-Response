import styles from "./PaymentCard.module.css"

export default function PaymentCard({ payment }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPaymentTypeClass = (type) => {
    return `${styles.paymentType} ${styles[type] || ""}`
  }

  return (
    <div className={styles.mainCard}>
      <div className={styles.header}>
        <strong className={styles.paymentId}>Payment #{payment.id}</strong>
      </div>

      <div className={styles.detail}>
        <span className={styles.label}>User ID: </span>
        <span className={styles.value}>{payment.user_id}</span>
      </div>

      <div className={styles.detail}>
        <span className={styles.label}>Order ID: </span>
        <span className={styles.value}>{payment.order_id}</span>
      </div>

      <div className={styles.detail}>
        <span className={styles.label}>Payment Type: </span>
        <span className={getPaymentTypeClass(payment.payment_type)}>{payment.payment_type}</span>
      </div>

      <div className={styles.detail}>
        <span className={styles.label}>Payment Date: </span>
        <span className={styles.value}>{formatDate(payment.payment_date)}</span>
      </div>
    </div>
  )
}
