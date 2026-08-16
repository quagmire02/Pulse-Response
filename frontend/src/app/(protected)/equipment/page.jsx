"use client"

import { useState, useEffect, useRef } from "react"
import { getEquipmentAction } from "@/actions/equipmentActions"
import EquipmentCard from "@/components/cards/EquipmentCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [availableOnly, setAvailableOnly] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      setError("")
      const params = { page: currentPage }
      if (search) params.search = search
      if (category) params.category = category
      if (condition) params.condition = condition
      if (minPrice) params.min_price = minPrice
      if (maxPrice) params.max_price = maxPrice
      if (availableOnly) params.available_only = true

      const result = await getEquipmentAction(params)
      if (cancelled) return
      if (result.error) {
        setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setEquipment(result.data || [])
        setPagination(result.pagination)
      }
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [currentPage, search, category, condition, minPrice, maxPrice, availableOnly])

  const handleChange = (setter) => (e) => { setter(e.target.value); setCurrentPage(1) }

  const fetchSuggestions = async (term) => {
    if (!term || term.trim() === "") {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const result = await getEquipmentAction({ search: term, per_page: 100 })
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

  const handleReset = () => {
    setSearch(""); setCategory(""); setCondition("")
    setMinPrice(""); setMaxPrice(""); setAvailableOnly(false)
    setSuggestions([]); setShowSuggestions(false); setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Equipment</h1>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper} ref={searchContainerRef}>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={handleSearchChange}
            onFocus={() => search && setShowSuggestions(suggestions.length > 0)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className={styles.suggestionDropdown}>
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  className={styles.suggestionItem}
                  onMouseDown={() => handleSuggestionClick(item.name)}
                >
                  <span className={styles.suggestionName}>{item.name}</span>
                  {item.category && <span className={styles.suggestionMeta}>{item.category}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input className={styles.filterInput} type="text" placeholder="Category (e.g. oxygen, vaccine)" value={category} onChange={handleChange(setCategory)} />
        <select className={styles.filterSelect} value={condition} onChange={handleChange(setCondition)}>
          <option value="">Any Condition</option>
          <option value="new">New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
        </select>
        <input className={styles.filterInput} type="number" placeholder="Min price/day" value={minPrice} onChange={handleChange(setMinPrice)} />
        <input className={styles.filterInput} type="number" placeholder="Max price/day" value={maxPrice} onChange={handleChange(setMaxPrice)} />
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={availableOnly} onChange={(e) => { setAvailableOnly(e.target.checked); setCurrentPage(1) }} />
          Available only
        </label>
        <button className={styles.resetButton} onClick={handleReset}>Reset</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {equipment.length > 0 ? (
            equipment.map((item) => <EquipmentCard key={item.id} equipment={item} />)
          ) : (
            <div className={styles.noData}>No equipment found</div>
          )}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination currentPage={currentPage} totalPages={pagination.total_pages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  )
}
