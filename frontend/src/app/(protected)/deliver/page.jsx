"use client"

import { useState, useEffect } from "react"
import { getDeliveriesAction } from "@/actions/deliveryActions"
import DeliverCard from "@/components/cards/DeliverCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

export default function DeliverPage() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchDeliveries = async (page = 1) => {
    setLoading(true)
    setError("")

    try {
      const result = await getDeliveriesAction({ page })

      if (result.error) {
        setError(result.error)
      } else {
        setDeliveries(result.data || [])
        setTotalPages(result.pagination?.total_pages || 1)
        setCurrentPage(page)
      }
    } catch (err) {
      setError("Failed to fetch deliveries")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveries(1)
  }, [])

  const handlePageChange = (page) => {
    fetchDeliveries(page)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading deliveries...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Deliveries</h1>
        <p className={styles.subtitle}>Manage and track all deliveries</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {deliveries.length === 0 && !error ? (
        <div className={styles.noData}>
          <p>No deliveries found</p>
        </div>
      ) : (
        <>
          <div className={styles.deliveriesGrid}>
            {deliveries.map((delivery) => (
              <DeliverCard key={delivery.id} delivery={delivery} />
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
