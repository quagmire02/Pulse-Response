"use client"
import { useFormStatus } from "react-dom"
import { useState } from "react"
import { logoutAction } from "@/actions/authActions"
import styles from "./buttons.module.css"
import { getCartItemsAction, updateCartItemsAction } from "@/actions/cartActions"
import { getUserIdAction } from "@/actions/authActions"

export function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={styles.loginButton}>
      {pending ? "Logging in..." : "Login"}
    </button>
  )
}

export function LogoutButton() {
  const { pending } = useFormStatus()

  return (
    <form action={logoutAction}>
      <button type="submit" className={styles.logoutButton} disabled={pending}>
        {pending ? "Logging Out..." : "Logout"}
      </button>
    </form>
  )
}

export function SignupButton() {
  const { pending } = useFormStatus()
  const buttonText =  "Sign Up"
  const pendingText =  "Creating Account..."

  return (
    <button type="submit" disabled={pending} className={styles.signupButton}>
      {pending ? pendingText : buttonText}
    </button>
  )

}


export function DeleteButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className={styles.deleteButton}>
      Delete Account
    </button>
  )
}


export function UpdateButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={styles.updateButton}>
      {pending ? "Updating..." : "Update Profile"}
    </button>
  )
}


export function AddToCartButton({ medicineId, isAvailable, disabled }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = async (e) => {
    e.stopPropagation()

    if (disabled || isLoading) return

    setIsLoading(true)

    try {
      const userId = await getUserIdAction()
      if (!userId) {
        console.error("User not logged in")
        return
      }

      const cartResult = await getCartItemsAction(userId)
      let cartId = cartResult['data']['cart_id']
      let existingItems = cartResult['data']['cart_items']

      if (cartResult.data && Array.isArray(cartResult.data)) {
        existingItems = cartResult.data
        if (existingItems.length > 0) {
          cartId = existingItems[0].cart_id
        }
      }

      const existingItemIndex = existingItems.findIndex((item) => item.medicine_id === medicineId)

      let updatedItems = []
      if (existingItemIndex >= 0) {
        updatedItems = existingItems.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.medicine_id === medicineId ? item.quantity + 1 : item.quantity,
        }))
      } else {
        updatedItems = [
          ...existingItems.map((item) => ({
            medicine_id: item.medicine_id,
            quantity: item.quantity,
          })),
          { medicine_id: medicineId, quantity: 1 },
        ]
      }

      if (cartId) {
        const updateResult = await updateCartItemsAction(cartId, updatedItems)
        if (updateResult.error) {
          console.error("Failed to update cart:", updateResult.error)
          return
        }
      }

      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 2000)
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (isLoading) return "Adding..."
    if (isAdded) return "Added!"
    if (!isAvailable) return "Unavailable"
    return "Add to Cart"
  }

  const getButtonClass = () => {
    let className = styles.AddToCartbutton
    if (disabled || !isAvailable) className += ` ${styles.AddToCartbuttondisabled}`
    if (isLoading) className += ` ${styles.AddToCartbuttonloading}`
    if (isAdded) className += ` ${styles.AddToCartbuttonadded}`
    return className
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || !isAvailable || isLoading}
      className={getButtonClass()}
      aria-label={`Add ${medicineId} to cart`}
    >
      {getButtonText()}
    </button>
  )
}


export function AdminDashboardButton({ children, onClick, disabled = false }) {
  return (
    <button className={styles.AdminDashboardButton} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}


export function CreateCategoryButton({ onClick, disabled = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles.createCategoryButton}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={styles.icon}
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      Create Category
    </button>
  )
}


export function RemoveButton({ onClick, disabled = false }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={styles.removeButton}
      aria-label="Remove item"
    >
      {pending ? (
        <span className={styles.removeButton.spinner}></span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}


export function CreateMedicineButton({ onClick }) {
  return (
    <button onClick={onClick} className={styles.CreateMedicineButton}>
      + Create Medicine
    </button>
  )
}


export function SubmitButton({ children, loading = false, disabled = false, ...props }) {
  return (
    <button
      type="submit"
      className={`${styles.SubmitButton} ${loading ? styles.SubmitButton.loading : ""}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? "Processing..." : children}
    </button>
  )
}

export function CheckoutButton({ onClick }) {
  const { pending } = useFormStatus()

  return (
    <button className={styles.CheckoutButton} onClick={onClick} disabled={pending}>
      {pending ? "Processing..." : "Proceed to Checkout"}
    </button>
  )
}

export function AddFeedbackButton({ onClick }) {
  return (
    <button onClick={onClick} className={styles.AddFeedbackButton}>
      Add Feedback
    </button>
  )
}

export function AddFeedbackSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={styles.AddFeedbackSubmitButton}>
      {pending ? "Adding..." : "Add Feedback"}
    </button>
  )
}

function CancelButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={styles.CancelOrdercancelButton}>
      {pending ? "Cancelling..." : "Cancel Order"}
    </button>
  )
}

export function CancelOrderButton({ onCancel }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (formData) => {
    await onCancel()
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className={styles.CancelOrderconfirmDialog}>
        <p className={styles.CancelOrderconfirmText}>Are you sure you want to cancel this order?</p>
        <div className={styles.CancelOrderconfirmButtons}>
          <form action={handleSubmit}>
            <CancelButton />
          </form>
          <button onClick={() => setShowConfirm(false)} className={styles.CancelOrderkeepButton}>
            Keep Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setShowConfirm(true)} className={styles.CancelOrderbutton}>
      Cancel Order
    </button>
  )
}

export function DeleteFeedbackButton({ onClick }) {
  return (
    <button onClick={onClick} className={styles.DeleteFeedbackButton}>
      Delete
    </button>
  )
}

export function UpdateFeedbackButton({ onClick }) {
  return (
    <button onClick={onClick} className={styles.UpdateFeedbackButton}>
      Edit
    </button>
  )
}
