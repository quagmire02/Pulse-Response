"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getDeliveryAction } from "@/actions/deliveryActions"
import DeliverDetailCard from "@/components/cards/DeliverDetailCard"
import styles from "./page.module.css"

export default function DeliveryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!params.id) return

      setLoading(true)
      setError("")

      try {
        const result = await getDeliveryAction(params.id)

        if (result.error) {
          setError(result.error)
        } else {
          setDelivery(result.data)
        }
      } catch (err) {
        setError("Failed to fetch delivery details")
      } finally {
        setLoading(false)
      }
    }

    fetchDelivery()
  }, [params.id])

  const handleDeleteSuccess = () => {
    router.push("/deliver")
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading delivery details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => router.push("/deliver")} className={styles.backButton}>
          ← Back to Deliveries
        </button>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>
          <p>Delivery not found</p>
          <button onClick={() => router.push("/deliver")} className={styles.backButton}>
            ← Back to Deliveries
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push("/deliver")} className={styles.backButton}>
          ← Back 
        </button>
        <h1 className={styles.title}>Delivery Details</h1>
      </div>

      <DeliverDetailCard delivery={delivery} onDeleteSuccess={handleDeleteSuccess} />
    </div>
  )
}
