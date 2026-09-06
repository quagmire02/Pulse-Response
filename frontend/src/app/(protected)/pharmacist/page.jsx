"use client"

import { useState, useEffect, useRef } from "react"
import { getPharmacistsAction } from "@/actions/pharmacistActions"
import { getUserRoleAction } from "@/actions/authActions"
import PharmacistCard from "@/components/cards/PharmacistCard"
import Pagination from "@/components/paginations/Pagination"
import CreatePharmacistButton from "@/components/buttons/CreatePharmacistButton"
import CreatePharmacistModal from "@/components/modals/CreatePharmacistModal"
import styles from "./page.module.css"

export default function PharmacistPage() {
  const [pharmacists, setPharmacists] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [search, setSearch] = useState("")
  const [speciality, setSpeciality] = useState("")
  const [location, setLocation] = useState("")
  const [minRating, setMinRating] = useState("")
  const [consultationOnly, setConsultationOnly] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef(null)

  useEffect(() => {
    const fetchRole = async () => {
      try { setUserRole(await getUserRoleAction()) } catch {}
    }
    fetchRole()
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchPharmacists = async () => {
      setLoading(true)
      setError("")
      try {
        const params = { page: currentPage }
        if (search) params.search = search
        if (speciality) params.speciality = speciality
        if (location) params.location = location
        if (minRating) params.min_rating = minRating
        if (consultationOnly) params.consultation = true

        const result = await getPharmacistsAction(params)
        if (cancelled) return

        if (result.error) {
          setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
        } else {
          setPharmacists(result.data || [])
          setPagination(result.pagination)
        }
      } catch {
        if (!cancelled) setError("Failed to fetch pharmacists")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPharmacists()
    return () => { cancelled = true }
  }, [currentPage, search, speciality, location, minRating, consultationOnly])

  const fetchSuggestions = async (term) => {
    if (!term || term.trim() === "") {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const result = await getPharmacistsAction({ search: term, per_page: 100 })
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
    setSearch(value)
    setCurrentPage(1)
    fetchSuggestions(value)
  }

  const handleSuggestionClick = (name) => {
    setSearch(name)
    setShowSuggestions(false)
    setCurrentPage(1)
  }

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearch("")
    setSpeciality("")
    setLocation("")
    setMinRating("")
    setConsultationOnly(false)
    setSuggestions([])
    setShowSuggestions(false)
    setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Doctors & Specialists</h1>
        {userRole === "super_admin" && (
          <CreatePharmacistButton onClick={() => setShowCreateModal(true)} />
        )}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper} ref={searchContainerRef}>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Search by name or speciality..."
            value={search}
            onChange={handleSearchChange}
            onFocus={() => search && setShowSuggestions(suggestions.length > 0)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className={styles.suggestionDropdown}>
              {suggestions.map((p) => {
                const fullName = `${p.user?.first_name ?? ""} ${p.user?.last_name ?? ""}`.trim()
                return (
                  <li
                    key={p.id}
                    className={styles.suggestionItem}
                    onMouseDown={() => handleSuggestionClick(fullName)}
                  >
                    <span className={styles.suggestionName}>{fullName}</span>
                    {p.speciality && <span className={styles.suggestionMeta}>{p.speciality}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <input
          className={styles.filterInput}
          type="text"
          placeholder="Speciality (e.g. Cardiology)"
          value={speciality}
          onChange={handleFilterChange(setSpeciality)}
        />
        <input
          className={styles.filterInput}
          type="text"
          placeholder="Location / Address"
          value={location}
          onChange={handleFilterChange(setLocation)}
        />
        <select
          className={styles.filterSelect}
          value={minRating}
          onChange={handleFilterChange(setMinRating)}
        >
          <option value="">Any Rating</option>
          <option value="5">⭐ 5 only</option>
          <option value="4">⭐ 4+</option>
          <option value="3">⭐ 3+</option>
          <option value="2">⭐ 2+</option>
        </select>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={consultationOnly}
            onChange={(e) => { setConsultationOnly(e.target.checked); setCurrentPage(1) }}
          />
          Available for consultation only
        </label>
        <button className={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.pharmacistGrid}>
          {pharmacists.length > 0 ? (
            pharmacists.map((pharmacist) => (
              <PharmacistCard key={pharmacist.id} pharmacist={pharmacist} />
            ))
          ) : (
            <div className={styles.noData}>No doctors found</div>
          )}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {showCreateModal && (
        <CreatePharmacistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); setCurrentPage(1) }}
        />
      )}
    </div>
  )
}
