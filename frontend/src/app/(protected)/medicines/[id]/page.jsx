"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getMedicineAction, getMedicinesAction } from "@/actions/medicineActions"
import MedicineDetailCard from "@/components/cards/MedicineDetailCard"
import styles from "./page.module.css"

export default function MedicineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alternatives, setAlternatives] = useState([])
  const [alternativesLoading, setAlternativesLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const medicineResponse = await getMedicineAction(params.id)

        if (medicineResponse.error) {
          setError(medicineResponse.error)
        } else {
          const medData = medicineResponse.data
          setMedicine(medData)

          if (medData.stock === 0 && medData.categories && medData.categories.length > 0) {
            setAlternativesLoading(true)
            try {
              const categoryName = medData.categories[0].name
              const alternativesResponse = await getMedicinesAction({
                category: categoryName,
                is_available: "true",
              })
              if (!alternativesResponse.error) {
                const filtered = (alternativesResponse.data || []).filter(
                  (item) => item.id !== medData.id
                )
                setAlternatives(filtered)
              }
            } catch (err) {
              console.error("Failed to load alternatives:", err)
            } finally {
              setAlternativesLoading(false)
            }
          }
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

      {medicine.stock === 0 && (
        <div className={styles.alternativesSection}>
          <h3 className={styles.alternativesTitle}>
            This item is currently out of stock. Clear Alternative Options:
          </h3>
          {alternativesLoading ? (
            <p className={styles.alternativesLoading}>Loading alternative options...</p>
          ) : alternatives.length > 0 ? (
            <div className={styles.alternativesGrid}>
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className={styles.altCard}
                  onClick={() => router.push(`/medicines/${alt.id}`)}
                >
                  {alt.image_url ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${alt.image_url}`}
                      alt={alt.name}
                      className={styles.altImage}
                    />
                  ) : (
                    <div className={styles.altPlaceholder}>No Image</div>
                  )}
                  <div className={styles.altInfo}>
                    <h4 className={styles.altName}>{alt.name}</h4>
                    <p className={styles.altBrand}>{alt.brand}</p>
                    <p className={styles.altPrice}>${alt.price}</p>
                    <span className={styles.altAvailable}>In Stock</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noAlternatives}>
              No in-stock alternatives found in the same category.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
