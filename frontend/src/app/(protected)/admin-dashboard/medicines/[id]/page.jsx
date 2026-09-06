"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getMedicineAction, deleteMedicineAction } from "@/actions/medicineActions"
import { getCategoriesAction } from "@/actions/categoryActions"
import MedicineDetailCard from "@/components/cards/MedicineDetailCard"
import DeleteGenModal from "@/components/modals/DeleteGenModal"
import UpdateMedicineModal from "@/components/modals/UpdateMedicineModal"
import styles from "./page.module.css"

export default function AdminMedicineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medicineResponse, categoriesResponse] = await Promise.all([getMedicineAction(params.id), getCategoriesAction()])

        if (medicineResponse.error) {
          setError(medicineResponse.error)
        } else {
          setMedicine(medicineResponse.data)
        }

        if (categoriesResponse.error) {
          console.error("Failed to fetch categories:", categoriesResponse.error)
        } else {
          setCategories(categoriesResponse.data)
        }
      } catch (err) {
        setError("Failed to fetch medicine details")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await deleteMedicineAction(params.id)
      if (response.error) {
        setError(response.error)
      } else {
        router.push("/admin-dashboard/medicines")
      }
    } catch (err) {
      setError("Failed to delete medicine")
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleUpdateSuccess = (updatedMedicine) => {
    setMedicine(updatedMedicine)
    setShowUpdateModal(false)
  }

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
        <h1 className={styles.title}>Medicine Details</h1>
      </div>

      <MedicineDetailCard
        medicine={medicine}
        onUpdate={() => setShowUpdateModal(true)}
        onDelete={() => setShowDeleteModal(true)}
        isAdmin={true}
      />

      {showDeleteModal && (
        <DeleteGenModal
          isOpen={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Medicine"
          message="Are you sure you want to delete this medicine item? This action cannot be undone."
          isLoading={deleting}
        />
      )}

      {showUpdateModal && (
        <UpdateMedicineModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          medicine={medicine}
          categories={categories}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}
