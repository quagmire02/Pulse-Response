"use client"
import { useState } from "react"
import { updateCartItemsAction, getCartItemsAction, deleteCartItemAction } from "@/actions/cartActions"
import { getUserIdAction } from "@/actions/authActions"
import styles from "./CartItemCard.module.css"

export default function CartItemCard({ item, onUpdate }) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateQuantity = async (newQuantity) => {
    if (newQuantity < 1) return

    try {
      setLoading(true)
      setError("")

      const userId = await getUserIdAction()
      if (!userId) {
        setError("User not logged in")
        return
      }

      // Get current cart items
      // Fix is here: Destructure the cart_items directly from the response
      const currentCart = await getCartItemsAction(userId)
      if (currentCart.error) {
        setError("Failed to update cart")
        return
      }
      const cartItems = currentCart.data.cart_items || [];


      // Create new request body with updated quantity
      const updatedItems = cartItems.map((cartItem) => ({
        medicine_id: cartItem.medicine.id, // Access the medicine ID from the nested medicine object
        quantity: cartItem.id === item.id ? newQuantity : cartItem.quantity,
      }))

      const result = await updateCartItemsAction(item.cart_id, updatedItems)

      if (result.error) {
        setError("Failed to update cart")
      } else {
        setQuantity(newQuantity)
        onUpdate() // Refresh the cart
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

      const userId = await getUserIdAction()
      if (!userId) {
        setError("User not logged in")
        return
      }

      const currentCart = await getCartItemsAction(userId);
      if (currentCart.error) {
        setError("Failed to remove item")
        return
      }
      const cartItems = currentCart.data.cart_items || [];


      const updatedItems = cartItems
        .filter((cartItem) => cartItem.id !== item.id)
        .map((cartItem) => ({
          medicine_id: cartItem.medicine.id,
          quantity: cartItem.quantity,
        }))

      let result;

      if (updatedItems.length === 0) {
        result = await deleteCartItemAction(item.cart_id)
      } else {
        result = await updateCartItemsAction(item.cart_id, updatedItems)
      }

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

  const itemTotal = (Number.parseFloat(item.medicine.price) * quantity).toFixed(2)

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.info}>
          <h3 className={styles.name}>{item.medicine.name}</h3>
          <p className={styles.price}>${item.medicine.price} each</p>
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
            <span className={styles.totalAmount}>${itemTotal}</span>
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