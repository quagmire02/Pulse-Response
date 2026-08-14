"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import { deleteEquipmentAction } from "@/actions/equipmentActions"
import UpdateEquipmentModal from "@/components/modals/UpdateEquipmentModal"
import DeleteModal from "@/components/modals/DeleteModal"
import styles from "./EquipmentDetailCard.module.css"

export default function EquipmentDetailCard({ equipment, onUpdateSuccess, onDeleteSuccess }) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState(null)

  const isOwner = equipment.vendor && currentUserId == equipment.vendor.user_id
  const isAdmin = currentUserRole === "admin" || currentUserRole === "super_admin"
  const canManage = isOwner || isAdmin

  useEffect(() => {
    const fetchUser = async () => {
      const id = await getUserIdAction()
      const role = await getUserRoleAction()
      setCurrentUserId(id)
      setCurrentUserRole(role)
    }
    fetchUser()
  }, [])

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError("")
    try {
      const result = await deleteEquipmentAction(equipment.id)
      if (result.error) {
        setDeleteError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setShowDeleteModal(false)
        onDeleteSuccess()
      }
    } catch {
      setDeleteError("Failed to delete equipment listing.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const imageUrl = equipment.image
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/storage/${equipment.image}`
    : "/placeholder.svg?height=400&width=600&query=equipment"

  return (
    <div className={styles.card}>
      <div className={styles.layout}>
        <div className={styles.imageSection}>
          <img src={imageUrl} alt={equipment.name} className={styles.image} />
          <div className={`${styles.availabilityBadge} ${equipment.is_available ? styles.available : styles.unavailable}`}>
            {equipment.is_available ? "Available" : "Rented Out / Unavailable"}
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.header}>
            <span className={styles.category}>{equipment.category}</span>
            <h1 className={styles.name}>{equipment.name}</h1>
            <div className={styles.priceRow}>
              <span className={styles.price}>${equipment.price_per_day}</span>
              <span className={styles.priceUnit}>/ day</span>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Condition</span>
              <span className={`${styles.conditionBadge} ${styles[equipment.condition]}`}>
                {equipment.condition}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Quantity</span>
              <span className={styles.metaValue}>{equipment.quantity} available</span>
            </div>
            {equipment.size && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Size / Capacity</span>
                <span className={styles.metaValue}>{equipment.size}</span>
              </div>
            )}
          </div>

          {equipment.description && (
            <div className={styles.descriptionBlock}>
              <h3>Description</h3>
              <p>{equipment.description}</p>
            </div>
          )}

          {equipment.safety_rules && (
            <div className={styles.safetyBlock}>
              <h3>Safety Rules & Regulations</h3>
              <p>{equipment.safety_rules}</p>
            </div>
          )}

          {equipment.vendor && (
            <div className={styles.vendorBlock}>
              <div className={styles.vendorLabel}>Provided By</div>
              <Link href={`/vendor/${equipment.vendor.user_id}`} className={styles.vendorLink}>
                🏪 {equipment.vendor.company_name}
              </Link>
              {equipment.vendor.contact_phone && (
                <div className={styles.vendorPhone}>Phone: {equipment.vendor.contact_phone}</div>
              )}
            </div>
          )}

          {canManage && (
            <div className={styles.adminActions}>
              <button onClick={() => setShowUpdateModal(true)} className={styles.editBtn}>
                Edit Listing
              </button>
              <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
                Delete Listing
              </button>
            </div>
          )}
        </div>
      </div>

      {showUpdateModal && (
        <UpdateEquipmentModal
          equipment={equipment}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            setShowUpdateModal(false)
            onUpdateSuccess()
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          title="Delete Equipment listing"
          message={`Are you sure you want to delete "${equipment.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  )
}
