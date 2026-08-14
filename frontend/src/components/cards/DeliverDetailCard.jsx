"use client"

import { useState } from "react"
import DeleteButton from "@/components/buttons/DeleteButton"
import DeleteModal from "@/components/modals/DeleteModal"
import { deleteDeliveryAction } from "@/actions/deliveryActions"
import styles from "./DeliverDetailCard.module.css"

export default function DeliverDetailCard({ delivery, onDeleteSuccess }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
    setError("")
    setSuccess("")
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    setError("")

    try {
      const result = await deleteDeliveryAction(delivery.id)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Delivery deleted successfully")
        setTimeout(() => {
          onDeleteSuccess()
        }, 1500)
      }
    } catch (err) {
      setError("Failed to delete delivery")
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2 className={styles.orderId}>Order #{delivery.order_id}</h2>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${getStatusColor(delivery.delivery_status)}`}>
                {delivery.delivery_status}
              </span>
              <span className={`${styles.badge} ${getTypeColor(delivery.delivery_type)}`}>
                {delivery.delivery_type}
              </span>
            </div>
          </div>
          <DeleteButton onClick={handleDeleteClick}>Delete Delivery</DeleteButton>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.cardBody}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Delivery Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Delivery ID:</span>
                <span className={styles.value}>{delivery.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Tracking Number:</span>
                <span className={styles.value}>{delivery.track_num}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Estimated Delivery:</span>
                <span className={styles.value}>{formatDate(delivery.est_del_date)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Actual Delivery:</span>
                <span className={styles.value}>{formatDate(delivery.act_del_date)}</span>
              </div>
            </div>
          </div>

          {delivery.order && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Order Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Order ID:</span>
                  <span className={styles.value}>{delivery.order.id}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>User ID:</span>
                  <span className={styles.value}>{delivery.order.user_id}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Total Amount:</span>
                  <span className={styles.value}>${delivery.order.total_amount}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Order Date:</span>
                  <span className={styles.value}>{formatDate(delivery.order.order_date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Order Status:</span>
                  <span className={styles.value}>{delivery.order.order_status}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Payment Status:</span>
                  <span className={styles.value}>{delivery.order.payment_status}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Subscription:</span>
                  <span className={styles.value}>{delivery.order.subscribe_type}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Delivery"
        message={`Are you sure you want to delete delivery for Order #${delivery.order_id}? This action cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  )
}
