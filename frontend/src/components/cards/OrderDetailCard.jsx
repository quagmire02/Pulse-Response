"use client"

import { storageUrl } from "@/libs/images"
import styles from "./OrderDetailCard.module.css"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { deleteOrderAction, updateOrderAction } from "@/actions/orderActions"
import { getUserIdAction } from "@/actions/authActions"

export default function OrderDetailCard({ order, isAdmin = false }) {
  const router = useRouter()
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getUserIdAction();
        setUserId(id);
      } catch (err) {
        // Handle error if user ID cannot be retrieved
        console.error("Failed to get user ID:", err);
      }
    };
    fetchUserId();
  }, []);

  const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return styles.statusPending
      case "processing":
        return styles.statusPreparing
      case "ready":
        return styles.statusReady
      case "delivered":
        return styles.statusDelivered
      case "canceled":
        return styles.statuscanceled
      default:
        return styles.statusDefault
    }
  }

  const getSubscribeTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case "none":
        return styles.statuscanceled
      case "monthly":
        return styles.statusPreparing
      case "weekly":
        return styles.statusReady
      default:
        return styles.statusDefault
    }
  }

  const getDeliveryTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case "basic":
        return styles.statusPreparing
      case "rapid":
        return styles.paymentPaid
      case "emergency":
        return styles.paymentFailed
      default:
        return styles.paymentDefault
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return styles.paymentPaid
      case "pending":
        return styles.paymentPending
      case "failed":
        return styles.paymentFailed
      default:
        return styles.paymentDefault
    }
  }

  const onDelete = async () => {
    try {
      const result = await deleteOrderAction(order.id)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Order deleted successfully!")
        setTimeout(() => {
          router.push("/orders")
        }, 1500)
      }
    } catch (err) {
      setError("Failed to cancel order")
    }
  }

  const onUpdate = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    const formData = new FormData(e.target);
    
    try {
      const result = await updateOrderAction(order.id, formData);
      if (result.error) {
        setError(result.error.error);
      } else {
        setSuccess("Order updated successfully!");
        setIsUpdating(false); // Hide the form on success
        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      }
    } catch (err) {
      setError("Failed to update order");
    }
  };

  const isOrderOwner = userId && order.user_id == userId;

  const dateFormat = (dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.orderInfo}>
          <h2 className={styles.orderId}>
            Order #{order.id} {order.subscribe_type !== "none" && <span title="Subscription Order">🔄</span>}
          </h2>
          <p className={styles.orderDate}>{formatOrderDate(order.order_date)}</p>
          {order.is_subscription_renewal && order.parent_order_id && (
            <p className={styles.renewalNotice} style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#666" }}>
              🔄 Automated renewal of <Link href={`/orders/${order.parent_order_id}`} style={{ color: "#0b79d4", fontWeight: "600" }}>Original Order #{order.parent_order_id}</Link>
            </p>
          )}
          {order.discount_amount && Number(order.discount_amount) > 0 && (
            <p className={styles.discountNotice} style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#2e7d32", fontWeight: "600" }}>
              Saved ${Number(order.discount_amount).toFixed(2)} with {order.subscribe_type} discount!
            </p>
          )}
          {order.next_delivery_date && order.order_status !== "canceled" && (
            <p className={styles.nextDeliveryNotice} style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#0d47a1", fontWeight: "600" }}>
              Next delivery scheduled for {formatOrderDate(order.next_delivery_date)}
            </p>
          )}
        </div>
        <div className={styles.totalAmount}>${order.total_amount}</div>
      </div>

      <div className={styles.statusSection}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Order Status:</span>
          <span className={`${styles.statusBadge} ${getStatusColor(order.order_status)}`}>{order.order_status}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Payment Status:</span>
          <span className={`${styles.statusBadge} ${getPaymentStatusColor(order.payment_status)}`}>
            {order.payment_status}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Subscription:</span>
          <span className={`${styles.statusBadge} ${getSubscribeTypeClass(order.subscribe_type)}`}>
            {order.subscribe_type}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Delivery Type:</span>
          <span className={`${styles.statusBadge} ${getDeliveryTypeClass(order.delivery.delivery_type)}`}>
            {order.delivery.delivery_type}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Delivery Status:</span>
          <span className={`${styles.statusBadge} ${getStatusColor(order.delivery.delivery_status)}`}>
            {order.delivery.delivery_status}
          </span>
        </div>
      </div>

      <div className={styles.customerSection}>
        <h3 className={styles.sectionTitle}>Customer Information</h3>
        <div className={styles.customerInfo}>
          <div className={styles.customerDetail}>
            <span className={styles.label}>Customer ID:</span>
            <span className={styles.value}>{order.user_id}</span>
          </div>
          <div className={styles.customerDetail}>
            <span className={styles.label}>Username:</span>
            <span className={styles.value}>{order.user.username}</span>
          </div>
        </div>
      </div>

      <div className={styles.customerSection}>
        <h3 className={styles.sectionTitle}>Delivery Information</h3>
        <div className={styles.customerInfo}>
          <div className={styles.customerDetail}>
            <span className={styles.label}>Estimated Delivery Date:</span>
            <span className={styles.value}>{dateFormat(order.delivery.est_del_date)}</span>
          </div>
          <div className={styles.customerDetail}>
            <span className={styles.label}>Date Delivered:</span>
            <span className={styles.value}>{dateFormat(order.delivery.del_date)}</span>
          </div>
        </div>
      </div>

      <div className={styles.customerSection}>
        <h3 className={styles.sectionTitle}>Prescriptions</h3>
        {order.prescriptions && order.prescriptions.length > 0 ? (
          <div className={styles.prescriptions}>
            {order.prescriptions.map((prescription, index) => (
              <div key={prescription.id} className={styles.prescriptionItem}>
                <span className={styles.prescriptionLabel}>Prescription {index + 1}:</span>
                <span className={styles.prescriptionValue}>
                  <Link href={storageUrl(prescription.image_url)} target="_blank">
                    Image {index + 1}
                  </Link>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noPrescriptions}>No prescriptions found.</p>
        )}
      </div>

      <div className={styles.itemsSection}>
        <h3 className={styles.sectionTitle}>Order Items</h3>
        <div className={styles.orderItems}>
          {order.order_items.map((item) => {
            const isEquipment = item.item_type && item.item_type !== "medicine"
            const product = isEquipment ? item.equipment : item.medicine
            const label = isEquipment
              ? item.item_type === "equipment_rental"
                ? `Rental, ${item.rental_start} to ${item.rental_end}`
                : "Equipment purchase"
              : `Medicine ID: ${item.medicine_id}`

            return (
              <div key={item.id} className={styles.orderItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{product?.name || "Unavailable item"}</span>
                  <span className={styles.itemId}>{label}</span>
                </div>
                <div className={styles.itemQuantity}>Qty: {item.quantity}</div>
              </div>
            )
          })}
        </div>
      </div>

      {order.equipment_fulfillments && order.equipment_fulfillments.length > 0 && (
        <div className={styles.itemsSection}>
          <h3 className={styles.sectionTitle}>Equipment Handover</h3>
          <div className={styles.orderItems}>
            {order.equipment_fulfillments.map((fulfillment) => (
              <div key={fulfillment.id} className={styles.orderItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>
                    {fulfillment.equipment?.name || "Equipment"}
                    {fulfillment.vendor?.company_name ? ` from ${fulfillment.vendor.company_name}` : ""}
                  </span>
                  <span className={styles.itemId}>
                    Status: {fulfillment.status}
                    {fulfillment.handover_scheduled_at
                      ? `, scheduled for ${new Date(fulfillment.handover_scheduled_at).toLocaleString()}`
                      : ""}
                  </span>
                  {fulfillment.handover_address && (
                    <span className={styles.itemId}>Address: {fulfillment.handover_address}</span>
                  )}
                  {fulfillment.vendor_note && (
                    <span className={styles.itemId}>Vendor note: {fulfillment.vendor_note}</span>
                  )}
                  {fulfillment.vendor?.contact_phone && (
                    <span className={styles.itemId}>Vendor phone: {fulfillment.vendor.contact_phone}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUpdating && (
        <form onSubmit={onUpdate} className={styles.updateForm}>
          {isAdmin && (
            <div className={styles.formGroup}>
              <label htmlFor="order_status">Order Status</label>
              <select name="order_status" id="order_status" className={styles.select} defaultValue={order.order_status}>
                <option value="">None</option>
                <option value="delivered">Delivered</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          )}
          {isOrderOwner && (
            <div className={styles.formGroup}>
              <label htmlFor="subscribe_type">Subscription</label>
              <select name="subscribe_type" id="subscribe_type" className={styles.select} defaultValue={order.subscribe_type}>
                <option value="none">No Subscription</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
          <button type="submit" className={styles.updateButton}>
            Submit Update
          </button>
        </form>
      )}

      <br></br>

      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {(isAdmin || isOrderOwner) && (
        <div className={styles.actions}>
          <button onClick={() => setIsUpdating(!isUpdating)} className={styles.updateButton}>
            {isUpdating ? "Cancel Update" : "Update Order"}
          </button>
          {isAdmin && (
            <button onClick={onDelete} className={styles.deleteButton}>
              Delete Order
            </button>
          )}
        </div>
      )}
    </div>
  )
}

