"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import { deleteEquipmentAction } from "@/actions/equipmentActions"
import { addToCart, EQUIPMENT_PURCHASE, EQUIPMENT_RENTAL } from "@/libs/cart"
import UpdateEquipmentModal from "@/components/modals/UpdateEquipmentModal"
import DeleteModal from "@/components/modals/DeleteModal"
import { isAdminRole, isCustomerRole } from "@/libs/roles"
import styles from "./EquipmentDetailCard.module.css"

export default function EquipmentDetailCard({ equipment, onUpdateSuccess, onDeleteSuccess }) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState(null)

  const [rentalDays, setRentalDays] = useState(1)
  const [rentalStart, setRentalStart] = useState(new Date().toISOString().split("T")[0])
  const [purchaseQty, setPurchaseQty] = useState(1)
  const [cartLoading, setCartLoading] = useState("")
  const [rentalSuccess, setRentalSuccess] = useState("")
  const [rentalError, setRentalError] = useState("")

  const isOwner = equipment.vendor && currentUserId == equipment.vendor.user_id
  const isAdmin = isAdminRole(currentUserRole)
  const canManage = isOwner || isAdmin
  // Renting is a customer-only action, mirroring EquipmentRentalController.
  const canRent = isCustomerRole(currentUserRole) && !isOwner

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

  const rentalEndDate = () => {
    const end = new Date(rentalStart)
    end.setDate(end.getDate() + rentalDays - 1)
    return end.toISOString().split("T")[0]
  }

  /**
   * Both renting and buying now go through the cart, so a single checkout can
   * carry medicines and equipment together.
   */
  const handleAddRentalToCart = async () => {
    setCartLoading("rental")
    setRentalError("")
    setRentalSuccess("")

    const result = await addToCart({
      item_type: EQUIPMENT_RENTAL,
      equipment_id: equipment.id,
      quantity: 1,
      rental_start: rentalStart,
      rental_end: rentalEndDate(),
    })

    setCartLoading("")
    if (result.error) {
      setRentalError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setRentalSuccess("Rental added to your cart. Complete checkout to confirm the booking.")
    }
  }

  const handleAddPurchaseToCart = async () => {
    setCartLoading("purchase")
    setRentalError("")
    setRentalSuccess("")

    const result = await addToCart({
      item_type: EQUIPMENT_PURCHASE,
      equipment_id: equipment.id,
      quantity: purchaseQty,
    })

    setCartLoading("")
    if (result.error) {
      setRentalError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setRentalSuccess("Added to your cart.")
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
              {equipment.is_for_rent && (
                <>
                  <span className={styles.price}>${equipment.price_per_day}</span>
                  <span className={styles.priceUnit}>/ day</span>
                </>
              )}
              {equipment.is_for_sale && equipment.sale_price !== null && (
                <>
                  <span className={styles.price}>${equipment.sale_price}</span>
                  <span className={styles.priceUnit}>to buy</span>
                </>
              )}
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

          {canRent && equipment.is_available && equipment.quantity > 0 && (
            <>
              {equipment.is_for_rent && (
                <div className={styles.rentalSection}>
                  <h3>Rent this Equipment</h3>
                  <div className={styles.rentalForm}>
                    <div className={styles.rentalInputGroup}>
                      <label htmlFor="rentalStart">Start date:</label>
                      <input
                        type="date"
                        id="rentalStart"
                        min={new Date().toISOString().split("T")[0]}
                        value={rentalStart}
                        onChange={(e) => setRentalStart(e.target.value)}
                        className={styles.rentalInput}
                      />
                    </div>
                    <div className={styles.rentalInputGroup}>
                      <label htmlFor="rentalDays">Rental duration (days):</label>
                      <input
                        type="number"
                        id="rentalDays"
                        min="1"
                        max="90"
                        value={rentalDays}
                        onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                        className={styles.rentalInput}
                      />
                    </div>
                    <div className={styles.rentalPriceSummary}>
                      <span>Returns on {rentalEndDate()}. Total: </span>
                      <strong>${(rentalDays * parseFloat(equipment.price_per_day)).toFixed(2)}</strong>
                    </div>
                    <button
                      onClick={handleAddRentalToCart}
                      disabled={cartLoading !== ""}
                      className={styles.rentBtn}
                    >
                      {cartLoading === "rental" ? "Adding..." : "Add rental to cart"}
                    </button>
                  </div>
                </div>
              )}

              {equipment.is_for_sale && equipment.sale_price !== null && (
                <div className={styles.rentalSection}>
                  <h3>Buy this Equipment</h3>
                  <div className={styles.rentalForm}>
                    <div className={styles.rentalInputGroup}>
                      <label htmlFor="purchaseQty">Quantity:</label>
                      <input
                        type="number"
                        id="purchaseQty"
                        min="1"
                        max={equipment.quantity}
                        value={purchaseQty}
                        onChange={(e) => setPurchaseQty(parseInt(e.target.value) || 1)}
                        className={styles.rentalInput}
                      />
                    </div>
                    <div className={styles.rentalPriceSummary}>
                      <span>Total price: </span>
                      <strong>${(purchaseQty * parseFloat(equipment.sale_price)).toFixed(2)}</strong>
                    </div>
                    <button
                      onClick={handleAddPurchaseToCart}
                      disabled={cartLoading !== ""}
                      className={styles.rentBtn}
                    >
                      {cartLoading === "purchase" ? "Adding..." : "Add to cart"}
                    </button>
                  </div>
                </div>
              )}

              {rentalSuccess && <p className={styles.rentalSuccess}>{rentalSuccess}</p>}
              {rentalError && <p className={styles.rentalError}>{rentalError}</p>}
            </>
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
