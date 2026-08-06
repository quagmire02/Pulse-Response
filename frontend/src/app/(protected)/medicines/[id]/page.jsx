"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getMedicineAction } from "@/actions/medicineActions"

import { getUserIdAction } from "@/actions/authActions"
import MedicineDetailCard from "@/components/cards/MedicineDetailCard"
import styles from "./page.module.css"

export default function MedicineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await getUserIdAction()
        setCurrentUserId(userId)

        // Fetch medicine details
        const medicineResponse = await getMedicineAction(params.id)
        if (medicineResponse.error) {
          setError(medicineResponse.error)
        } else {
          setMedicine(medicineResponse.data)
        }

        
      } catch (err) {
        setError("Failed to fetch medicine details")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading medicine details...</div>
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

  if (!medicine) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Medicine not found</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
      </div>

      <h1 className={styles.title}> Details</h1>
      <MedicineDetailCard medicine={medicine} isAdmin={false} />

    
    </div>
  )
}
