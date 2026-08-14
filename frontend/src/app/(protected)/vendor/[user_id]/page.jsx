"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getVendorAction } from "@/actions/vendorActions"
import VendorDetailCard from "@/components/cards/VendorDetailCard"
import styles from "./page.module.css"

export default function VendorDetailPage() {
  const { user_id } = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchVendor = async () => {
    setLoading(true)
    const result = await getVendorAction(user_id)
    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setVendor(result.data)
    }
    setLoading(false)
  }

  useEffect(() => { if (user_id) fetchVendor() }, [user_id])

  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>
  if (error) return <div className={styles.container}><div className={styles.error}>{error}</div></div>
  if (!vendor) return <div className={styles.container}><div className={styles.error}>Vendor not found</div></div>

  return (
    <div className={styles.container}>
      <VendorDetailCard
        vendor={vendor}
        onUpdateSuccess={fetchVendor}
        onDeleteSuccess={() => router.push("/equipment")}
      />
    </div>
  )
}
