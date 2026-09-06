"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getCategoriesAction } from "@/actions/categoryActions"
import {
  getMedicinesAction,
  getMedicineSuggestionsAction,
  getMedicineAlternativesAction,
  requestMedicineRestockAction,
} from "@/actions/medicineActions"
import { getUserRoleAction } from "@/actions/authActions"
import { isCustomerRole } from "@/libs/roles"
import MedicineSidebar from "@/components/sidebars/MedicineSidebar"
import MedicineCard from "@/components/cards/MedicineCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

const SUGGESTION_MIN_CHARS = 1
const SUGGESTION_DEBOUNCE_MS = 150

function MedicinesPageContent() {
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
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [canOrder, setCanOrder] = useState(false)
  const [alternatives, setAlternatives] = useState([])
  const [alternativeGenerics, setAlternativeGenerics] = useState([])

  const [restockTarget, setRestockTarget] = useState(null)
  const [restockNotice, setRestockNotice] = useState("")
  const [restockBusy, setRestockBusy] = useState(false)
  const searchContainerRef = useRef(null)
  const debounceRef = useRef(null)

  const currentFilters = {
    name: searchParams.get("name") || "",
    category: searchParams.get("category") || "",
    is_available: searchParams.get("is_available") || "true",
    sort_by_price: searchParams.get("sort_by_price") || "",
    page: searchParams.get("page") || "1",
  }

  useEffect(() => {
    loadCategories()
    loadRole()
  }, [])

  useEffect(() => {
    loadMedicines()
  }, [searchParams])

  const loadRole = async () => {
    const role = await getUserRoleAction()
    setCanOrder(isCustomerRole(role))
  }

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
        await loadAlternatives(currentFilters.name, result.data)
      }
    } catch (err) {
      setError("Failed to load medicines")
    } finally {
      setLoading(false)
    }
  }

  const loadAlternatives = async (searchedName, results) => {
    const rows = results || []
    const hasStockedResult = rows.some((medicine) => medicine.stock > 0)

    setRestockNotice("")

    if (!searchedName || hasStockedResult) {
      setAlternatives([])
      setAlternativeGenerics([])
      setRestockTarget(null)
      return
    }

    const soldOutInGrid = rows.find((medicine) => medicine.stock <= 0) || null

    const result = await getMedicineAlternativesAction({ name: searchedName })
    if (result.error) {
      setAlternatives([])
      setAlternativeGenerics([])
      setRestockTarget(soldOutInGrid)
      return
    }

    const suggested = result.data || []
    const soldOut =
      soldOutInGrid || (result.requested || []).find((medicine) => medicine.stock <= 0) || null

    setAlternatives(suggested)
    setAlternativeGenerics(result.matchedBy === "generic_name" ? result.genericNames : [])

    setRestockTarget(suggested.length === 0 ? soldOut : null)
  }

  const handleRestockRequest = async () => {
    if (!restockTarget) return

    setRestockBusy(true)
    const result = await requestMedicineRestockAction(restockTarget.id)
    setRestockBusy(false)

    setRestockNotice(
      result.error
        ? typeof result.error === "string"
          ? result.error
          : "Could not send the request."
        : result.success
    )
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

  const fetchSuggestions = (term) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!term || term.trim().length < SUGGESTION_MIN_CHARS) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const result = await getMedicineSuggestionsAction(term)
      if (result.error) {
        setSuggestions([])
        return
      }
      setSuggestions(result.data)
      setShowSuggestions(result.data.length > 0)
      setHighlightIndex(-1)
    }, SUGGESTION_DEBOUNCE_MS)
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
      if (debounceRef.current) clearTimeout(debounceRef.current)
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
    setHighlightIndex(-1)
    updateFilters({ name: medName })
  }

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((index) => (index + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[highlightIndex].name)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
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
          <div className="pr-page-head" style={{ marginBottom: 18 }}>
            <div>
              <span className="pr-eyebrow">Pharmacy</span>
              <h1 className="pr-title">Medicines</h1>
              <p className="pr-subtitle">
                Search by brand or chemical name. Out of stock items suggest alternatives
                with the same active ingredient.
              </p>
            </div>
          </div>
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
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
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
                  {suggestions.map((medicine, index) => (
                    <li
                      key={medicine.id}
                      onMouseDown={() => handleSuggestionClick(medicine.name)}
                      onMouseEnter={() => setHighlightIndex(index)}
                      className={`${styles.suggestionItem} ${index === highlightIndex ? styles.suggestionItemActive : ""}`}
                    >
                      <div className={styles.suggestionName}>{medicine.name}</div>
                      {medicine.generic_name && (
                        <span className={styles.suggestionGeneric}>({medicine.generic_name})</span>
                      )}
                      {medicine.stock <= 0 && <span className={styles.suggestionOutOfStock}>Out of stock</span>}
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
                  medicines.map((medicine) => (
                    <MedicineCard key={medicine.id} medicine={medicine} canOrder={canOrder} />
                  ))
                ) : (
                  <div className={styles.noResults}>No medicines found</div>
                )}
              </div>

              {alternatives.length > 0 && (
                <div className={styles.alternativesSection}>
                  <h3 className={styles.alternativesTitle}>
                    {alternativeGenerics.length > 0
                      ? `"${currentFilters.name}" is out of stock — other ${alternativeGenerics.join(", ")} options:`
                      : `"${currentFilters.name}" is out of stock — similar options in the same category:`}
                  </h3>
                  <div className={styles.medicineGrid}>
                    {alternatives.map((medicine) => (
                      <MedicineCard key={medicine.id} medicine={medicine} canOrder={canOrder} />
                    ))}
                  </div>
                </div>
              )}

              {restockTarget && alternatives.length === 0 && (
                <div className={styles.alternativesSection}>
                  <h3 className={styles.alternativesTitle}>
                    {`"${restockTarget.name}" is out of stock and nothing comparable is available right now.`}
                  </h3>
                  <p className={styles.restockHint}>
                    {restockTarget.generic_name
                      ? `No other ${restockTarget.generic_name} product is in stock either.`
                      : "No product in the same category is in stock either."}{" "}
                    You can let the pharmacy team know you are waiting for it.
                  </p>

                  {restockNotice ? (
                    <p className={styles.restockNotice}>{restockNotice}</p>
                  ) : (
                    canOrder && (
                      <button
                        type="button"
                        className="pr-btn pr-btn-primary"
                        onClick={handleRestockRequest}
                        disabled={restockBusy}
                      >
                        {restockBusy ? "Sending..." : "Notify the pharmacy"}
                      </button>
                    )
                  )}
                </div>
              )}

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

/**
 * useSearchParams needs a Suspense boundary or the production build cannot
 * prerender this route. The page is behind auth and query driven, so the
 * boundary is the correct fix rather than opting out of prerendering.
 */
export default function MedicinesPage() {
  return (
    <Suspense fallback={null}>
      <MedicinesPageContent />
    </Suspense>
  );
}
