"use client"

import styles from "./OrderCard.module.css"

export default function OrderCard({ order, onClick, payment=false }) {
  const handleCardClick = () => {
    if (payment) {
      onClick(order.id)
    } else {
      onClick()
    }
  }

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return styles.pending
      case "delivered":
        return styles.delivered
      case "canceled":
        return styles.canceled
      default:
        return styles.default
    }
  }

  const getSubscribeTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case "none":
        return styles.canceled
      case "monthly":
        return styles.preparing
      case "yearly":
        return styles.ready
      default:
        return styles.default
    }
  }

  const getDeliveryTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case "basic":
        return styles.preparing
      case "rapid":
        return styles.paid
      case "emergency":
        return styles.failed
      default:
        return styles.default
    }
  }

  const getPaymentStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return styles.paid
      case "pending":
        return styles.paymentPending
      case "failed":
        return styles.failed
      default:
        return styles.default
    }
  }

  const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.header}>
        <h3 className={styles.orderId}>Order #{order.id}</h3>
        <div className={styles.amount}>${Number.parseFloat(order.total_amount).toFixed(2)}</div>
      </div>

      <div className={styles.content}>
        <div className={styles.detail}>
          <span className={styles.label}>User ID:</span>
          <span className={styles.value}>{order.user_id}</span>
        </div>

        <div className={styles.detail}>
          <span className={styles.label}>Order Date:</span>
          <span className={styles.value}>{formatOrderDate(order.order_date)}</span>
        </div>

        <div className={styles.statusRow}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Subscription:</span>
            <span className={`${styles.status} ${getSubscribeTypeClass(order.subscribe_type)}`}>{order.subscribe_type}</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.label}>Delivery Type:</span>
            <span className={`${styles.paymentStatus} ${getDeliveryTypeClass(order.delivery.delivery_type)}`}>
              {order.delivery.delivery_type}
            </span>
          </div>
        </div>

        <div className={styles.statusRow}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Status:</span>
            <span className={`${styles.status} ${getStatusClass(order.order_status)}`}>{order.order_status}</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.label}>Payment:</span>
            <span className={`${styles.paymentStatus} ${getPaymentStatusClass(order.payment_status)}`}>
              {order.payment_status}
            </span>
          </div>

          {
            payment && (
              <div className={styles.statusItem}>
                <span className={styles.label}>Confirm:</span>
                <span className={`${styles.paymentStatus} ${styles.payment}`}>
                  Confirm Payment
                </span>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

