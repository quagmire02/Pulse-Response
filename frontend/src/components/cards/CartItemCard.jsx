"use client"
import { useState } from "react"
import { setCartLineQuantity, removeCartLine } from "@/libs/cart"
import styles from "./CartItemCard.module.css"

const LABELS = {
  medicine: "Medicine",
  equipment_purchase: "Equipment purchase",
  equipment_rental: "Equipment rental",
}

/**
 * One basket line. Handles medicines, equipment bought outright and equipment
 * rented for a date range, since all three now share a single cart.
 */
export default function CartItemCard({ item, cartId, allItems, onUpdate }) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isRental = item.item_type === "equipment_rental"
  const product = item.item_type === "medicine" ? item.medicine : item.equipment
  const name = product?.name || "Unavailable item"

  const unitPrice = Number(item.unit_price ?? 0)
  const lineTotal = Number(item.line_total ?? unitPrice * quantity)

  const updateQuantity = async (newQuantity) => {
    if (newQuantity < 1) return

    try {
      setLoading(true)
      setError("")

      const result = await setCartLineQuantity(cartId, allItems, item.id, newQuantity)

      if (result.error) {
        setError("Failed to update cart")
      } else {
        setQuantity(newQuantity)
        onUpdate()
      }
    } catch (err) {
      setError("Failed to update cart")
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async () => {
    try {
      setLoading(true)
      setError("")

      const result = await removeCartLine(cartId, allItems, item.id)

      if (result.error) {
        setError("Failed to remove item")
      } else {
        onUpdate()
      }
    } catch (err) {
      setError("Failed to remove item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.typeBadge}>{LABELS[item.item_type] || "Item"}</span>
          <p className={styles.price}>
            ${unitPrice.toFixed(2)} {isRental ? "per day" : "each"}
          </p>
          {isRental && (
            <p className={styles.rentalMeta}>
              {item.rental_start} to {item.rental_end}
              {item.rental_days ? ` (${item.rental_days} day${item.rental_days === 1 ? "" : "s"})` : ""}
            </p>
          )}
          {item.equipment?.vendor?.company_name && (
            <p className={styles.rentalMeta}>Supplied by {item.equipment.vendor.company_name}</p>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.quantityControls}>
            <button
              className={styles.quantityButton}
              onClick={() => updateQuantity(quantity - 1)}
              disabled={loading || quantity <= 1}
            >
              -
            </button>
            <span className={styles.quantity}>{quantity}</span>
            <button className={styles.quantityButton} onClick={() => updateQuantity(quantity + 1)} disabled={loading}>
              +
            </button>
          </div>

          <div className={styles.total}>
            <span className={styles.totalAmount}>${lineTotal.toFixed(2)}</span>
          </div>

          <button className={styles.removeButton} onClick={removeItem} disabled={loading}>
            {loading ? "..." : "Remove"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
