"use client"

import { useState, useEffect } from "react"
import { getOrderAction, updateOrderAction } from "@/actions/orderActions"
import { useParams, useRouter } from "next/navigation"
import styles from "./page.module.css"

export default function StaffOrderDetail() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updateSuccess, setUpdateSuccess] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState("")

  const statusOptions = ["preparing", "ready", "picked", "delivered", "cancelled"]

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await getOrderAction(params.id)

      if (response.error) {
        setError(response.error)
      } else {
        setOrder(response.data)
        setSelectedStatus(response.data.order_status)
      }
    } catch (err) {
      setError("Failed to fetch order details")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return

    setUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(null)

    try {
      const formData = new FormData()
      formData.append("order_status", selectedStatus)

      const response = await updateOrderAction(params.id, formData)

      if (response.error) {
        setUpdateError(response.error.error)
      } else {
        setUpdateSuccess("Order status updated successfully!")
        // Refresh order data
        await fetchOrder()
      }
    } catch (err) {
      setUpdateError("Failed to update order status")
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return <div className={styles.loading}>Loading order details...</div>
  }

  if (error) {
    return <div className={styles.error}>Error: {typeof error === "object" ? JSON.stringify(error) : error}</div>
  }

  if (!order) {
    return <div className={styles.error}>Order not found</div>
  }

  return (
    <div className={styles.orderDetail}>
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back to Orders
        </button>

        <div className={styles.orderCard}>
          <div className={styles.header}>
            <h1>Order #{order.id}</h1>
            <div className={styles.amount}>${Number.parseFloat(order.total_amount).toFixed(2)}</div>
          </div>

          <div className={styles.orderInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Customer:</span>
              <span className={styles.value}>{order.user?.username || `User ID: ${order.user_id}`}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Order Date:</span>
              <span className={styles.value}>{formatDate(order.order_date)}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Current Status:</span>
              <span className={`${styles.status} ${styles[order.order_status]}`}>{order.order_status}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Payment Status:</span>
              <span className={`${styles.paymentStatus} ${styles[order.payment_status]}`}>{order.payment_status}</span>
            </div>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className={styles.orderItems}>
              <h3>Order Items</h3>
              {order.order_items.map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  <span className={styles.itemName}>{item.medicine?.name || `Medicine ID: ${item.medicine_id}`}</span>
                  <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.updateSection}>
            <h3>Update Order Status</h3>

            <div className={styles.statusUpdate}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={styles.statusSelect}
                disabled={updating}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === order.order_status}
                className={styles.updateButton}
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>

            {updateError && (
              <div className={styles.updateError}>
                {typeof updateError === "object" ? JSON.stringify(updateError) : updateError}
              </div>
            )}

            {updateSuccess && <div className={styles.updateSuccess}>{updateSuccess}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
