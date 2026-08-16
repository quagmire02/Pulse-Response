"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getCategoriesAction } from "@/actions/categoryActions"
import { getMedicinesAction } from "@/actions/medicineActions"
import MedicineSidebar from "@/components/sidebars/MedicineSidebar"
import MedicineCard from "@/components/cards/MedicineCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

export default function MedicinesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nameTerm, setSearchTerm] = useState(searchParams.get("name") || "")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef(null)

  const currentFilters = {
    name: searchParams.get("name") || "",
    category: searchParams.get("category") || "",
    is_available: searchParams.get("is_available") || "true",
    sort_by_price: searchParams.get("sort_by_price") || "",
    page: searchParams.get("page") || "1",
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadMedicines()
  }, [searchParams])

  const loadCategories = async () => {
    try {
      const result = await getCategoriesAction()
      if (result.error) {
        setError(result.error)
      } else {
        setCategories(result.data)
      }
    } catch (err) {
      setError("Failed to load categories")
    }
  }

  const loadMedicines = async () => {
    setLoading(true)
    try {
      const queryParams = {}

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams[key] = value
        }
      })

      const result = await getMedicinesAction(queryParams)
      if (result.error) {
        setError(result.error)
      } else {
        setMedicines(result.data)
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
    const params = new URLSearchParams(searchParams)

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    if (
      newFilters.name !== undefined ||
      newFilters.category !== undefined ||
      newFilters.is_available !== undefined ||
      newFilters.sort_by_price !== undefined
    ) {
      params.set("page", "1")
    }

    router.push(`/medicines?${params.toString()}`)
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
    } catch (err) {
      console.error("Error fetching suggestions:", err)
      setSuggestions([])
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    updateFilters({ name: nameTerm })
  }

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handlePageChange = (page) => {
    updateFilters({ page: page.toString() })
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <MedicineSidebar
          categories={categories}
          currentFilters={currentFilters}
          onFilterChange={updateFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={styles.main}>
          <h1 className={styles.title}>Medicines</h1>
          <div className={styles.mainHeader}>
            <button className={styles.sidebarToggle} onClick={toggleSidebar} aria-label="Toggle sidebar">
              ☰
            </button>

            <div ref={searchContainerRef} className={styles.searchContainer}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={nameTerm}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (nameTerm.trim() !== "") {
                      setShowSuggestions(true)
                    }
                  }}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                <button type="submit" className={styles.searchButton}>
                  Search
                </button>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.suggestionsDropdown}>
                  {suggestions.map((medicine) => (
                    <li
                      key={medicine.id}
                      onClick={() => handleSuggestionClick(medicine.name)}
                      className={styles.suggestionItem}
                    >
                      <div className={styles.suggestionName}>{medicine.name}</div>
                      {medicine.generic_name && (
                        <span className={styles.suggestionGeneric}>({medicine.generic_name})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {error && <div className={styles.error}>{typeof error === "string" ? error : "An error occurred"}</div>}

          {loading ? (
            <div className={styles.loading}>Loading medicines...</div>
          ) : (
            <>
              <div className={styles.medicineGrid}>
                {medicines.length > 0 ? (
                  medicines.map((medicine) => <MedicineCard key={medicine.id} medicine={medicine} />)
                ) : (
                  <div className={styles.noResults}>No medicines found</div>
                )}
              </div>

              {pagination && medicines.length > 0 && (
                <Pagination
                  currentPage={Number.parseInt(currentFilters.page)}
                  totalPages={pagination.total_pages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
