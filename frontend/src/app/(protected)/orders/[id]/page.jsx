"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getOrderAction, updateOrderAction } from "@/actions/orderActions"
import { getUserRoleAction, getUserIdAction } from "@/actions/authActions"
import OrderDetailCard from "@/components/cards/OrderDetailCard"
import {CancelOrderButton} from "@/components/buttons/buttons"
import styles from "./page.module.css"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const role = await getUserRoleAction()
        setUserRole(role)

        const userId = await getUserIdAction()
        setUserId(userId)

        const response = await getOrderAction(params.id)
        if (response.error) {
          setError(response.error)
        } else {
          setOrder(response.data)
        }
      } catch (err) {
        setError("Failed to fetch order details")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleCancelOrder = async () => {
    try {
      const formData = new FormData()
      formData.append("order_status", "canceled")

      const result = await updateOrderAction(params.id, formData)

      if (result.error) {
        setError(result.error)
      } else {
        const response = await getOrderAction(params.id)
        if (response.data) {
          setOrder(response.data)
        }
      }
    } catch (err) {
      setError("Failed to cancel order")
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading order details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Order not found</div>
      </div>
    )
  }

  const canCancel = order.order_status !== "canceled" && order.order_status !== "delivered" && order.user_id == userId

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Order Details</h1>
        {canCancel && <CancelOrderButton onCancel={handleCancelOrder} />}
      </div>
      <OrderDetailCard order={order} isAdmin={userRole === "admin" || userRole === "super_admin"} />
    </div>
  )
}
