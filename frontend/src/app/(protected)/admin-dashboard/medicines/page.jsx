"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getCategoriesAction } from "@/actions/categoryActions"
import { getMedicinesAction } from "@/actions/medicineActions"
import { deleteMedicineAction } from "@/actions/medicineActions"
import { getUserRoleAction } from "@/actions/authActions"
import MedicineSidebar from "@/components/sidebars/MedicineSidebar"
import Pagination from "@/components/paginations/Pagination"
import AdminMedicineCard from "@/components/cards/AdminMedicineCard"
import DeleteGenModal from "@/components/modals/DeleteGenModal"
import CreateMedicineModal from "@/components/modals/CreateMedicineModal"
import {CreateMedicineButton} from "@/components/buttons/buttons"
import styles from "./page.module.css"

export default function AdminMedicinesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [medicines, setMedicines] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nameTerm, setSearchTerm] = useState(searchParams.get("name") || "")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [medicineToDelete, setMedicineToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [ownedOnly, setOwnedOnly] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef(null)

  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
    category: searchParams.get("category") || "",
    is_available: searchParams.get("is_available") || "",
    sort_by_price: searchParams.get("sort_by_price") || "",
    page: searchParams.get("page") || "1",
  })

  useEffect(() => {
    loadCategories()
    resolveScope()
  }, [])

  useEffect(() => {
    loadMedicines()
  }, [filters, ownedOnly])

  const resolveScope = async () => {
    const role = await getUserRoleAction()
    setOwnedOnly(role === "pharmacist")
  }

  const loadCategories = async () => {
    try {
      const result = await getCategoriesAction()
      if (result.error) {
        console.error("Failed to load categories:", result.error)
      } else {
        setCategories(result.data || [])
      }
    } catch (err) {
      console.error("Failed to load categories:", err)
    }
  }

  const loadMedicines = async (currentFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams.append(key, value)
        }
      })

      if (ownedOnly) {
        queryParams.append("mine", "1")
      }

      const result = await getMedicinesAction(Object.fromEntries(queryParams))

      if (result.error) {
        setError(result.error)
      } else {
        setMedicines(result.data || [])
        setPagination(result.pagination)
        setError(null)
      }
    } catch (err) {
      setError("Failed to load medicines")
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: "1" }
    setFilters(updatedFilters)

    const queryParams = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        queryParams.append(key, value)
      }
    })

    const newUrl = `/admin-dashboard/medicines?${queryParams.toString()}`
    router.push(newUrl)
  }

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page: page.toString() }
    setFilters(updatedFilters)

    const queryParams = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        queryParams.append(key, value)
      }
    })

    const newUrl = `/admin-dashboard/medicines?${queryParams.toString()}`
    router.push(newUrl)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    updateFilters({ name: nameTerm })
  }

  const fetchSuggestions = async (term) => {
    if (!term || term.trim() === "") {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const result = await getMedicinesAction({ name: term, per_page: 100 })
      if (!result.error && result.data) {
        setSuggestions(result.data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
      }
    } catch {
      setSuggestions([])
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    fetchSuggestions(value)
  }

  const handleSuggestionClick = (medName) => {
    setSearchTerm(medName)
    setShowSuggestions(false)
    updateFilters({ name: medName })
  }

  const handleDeleteClick = (medicine) => {
    setMedicineToDelete(medicine)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!medicineToDelete) return

    setDeleting(true)
    try {
      const result = await deleteMedicineAction(medicineToDelete.id)

      if (result.error) {
        setError(result.error)
      } else {
        setShowDeleteModal(false)
        setMedicineToDelete(null)
        loadMedicines()
      }
    } catch (err) {
      setError("Failed to delete medicine")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setMedicineToDelete(null)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    loadMedicines()
  }

  const handleMedicineClick = (medicineId) => {
    router.push(`/admin-dashboard/medicines/${medicineId}`)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className={styles.container}>
      <MedicineSidebar
        categories={categories}
        currentFilters={filters}
        onFilterChange={updateFilters}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <div className={styles.headerTop}>
            <h1 className={styles.title}>
              {ownedOnly ? "My Medicines" : "Admin - Medicine Management"}
            </h1>
            <CreateMedicineButton onClick={() => setShowCreateModal(true)} />
        </div>
        {ownedOnly && (
          <p className={styles.scopeNote}>
            Showing the medicines you listed. Listings from other pharmacies are
            managed by them.
          </p>
        )}
        <div className={styles.mainHeader}>
          <button className={styles.sidebarToggle} onClick={toggleSidebar} aria-label="Toggle sidebar">
            ☰
          </button>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper} ref={searchContainerRef}>
              <input
                type="text"
                placeholder="Search medicines..."
                value={nameTerm}
                onChange={handleSearchChange}
                onFocus={() => nameTerm && setShowSuggestions(suggestions.length > 0)}
                className={styles.searchInput}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.suggestionDropdown}>
                  {suggestions.map((med) => (
                    <li
                      key={med.id}
                      className={styles.suggestionItem}
                      onMouseDown={() => handleSuggestionClick(med.name)}
                    >
                      <span className={styles.suggestionName}>{med.name}</span>
                      {med.category_names?.length > 0 && (
                        <span className={styles.suggestionMeta}>{med.category_names[0]}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        {error && <div className={styles.error}>{typeof error === "object" ? JSON.stringify(error) : error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading medicines...</div>
        ) : (
          <>
            <div className={styles.medicineGrid}>
              {medicines.length > 0 ? (
                medicines.map((medicine) => (
                  <AdminMedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    onDelete={() => handleDeleteClick(medicine)}
                    onClick={() => handleMedicineClick(medicine.id)}
                  />
                ))
              ) : (
                <div className={styles.noResults}>No medicines found</div>
              )}
            </div>

            {pagination && pagination.total_pages > 1 && (
              <Pagination
                currentPage={Number.parseInt(filters.page)}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

      {showDeleteModal && (
        <DeleteGenModal
          isOpen={showDeleteModal}
          title="Delete Medicine"
          message={`Are you sure you want to delete "${medicineToDelete?.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleting}
        />
      )}

      {showCreateModal && (
        <CreateMedicineModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          categories={categories}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}
