"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getEquipmentItemAction } from "@/actions/equipmentActions"
import EquipmentDetailCard from "@/components/cards/EquipmentDetailCard"
import styles from "./page.module.css"

export default function EquipmentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchEquipment = async () => {
    setLoading(true)
    const result = await getEquipmentItemAction(id)
    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setEquipment(result.data)
    }
    setLoading(false)
  }

  useEffect(() => { if (id) fetchEquipment() }, [id])

  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>
  if (error) return <div className={styles.container}><div className={styles.error}>{error}</div></div>
  if (!equipment) return <div className={styles.container}><div className={styles.error}>Equipment not found</div></div>

  return (
    <div className={styles.container}>
      <EquipmentDetailCard
        equipment={equipment}
        onUpdateSuccess={fetchEquipment}
        onDeleteSuccess={() => router.push("/equipment")}
      />
    </div>
  )
}
