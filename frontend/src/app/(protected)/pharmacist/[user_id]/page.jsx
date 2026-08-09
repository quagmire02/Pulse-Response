"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getPharmacistAction } from "@/actions/pharmacistActions"
import PharmacistDetailCard from "@/components/cards/PharmacistDetailCard"
import styles from "./page.module.css"

export default function PharmacistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [pharmacist, setPharmacist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchPharmacist = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await getPharmacistAction(params.user_id)

      if (result.error) {
        setError(result.error)
      } else {
        setPharmacist(result.data)
      }
    } catch (err) {
      setError("Failed to fetch pharmacist details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.user_id) {
      fetchPharmacist()
    }
  }, [params.user_id])

  const handleUpdateSuccess = () => {
    fetchPharmacist()
  }

  const handleDeleteSuccess = () => {
    router.push("/pharmacist")
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pharmacist details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{typeof error === "object" ? JSON.stringify(error) : error}</div>
      </div>
    )
  }

  if (!pharmacist) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Pharmacist not found</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <PharmacistDetailCard
        pharmacist={pharmacist}
        onUpdateSuccess={handleUpdateSuccess}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
