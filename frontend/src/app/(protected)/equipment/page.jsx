"use client"

import { useState, useEffect, useRef } from "react"
import { getEquipmentAction, getEquipmentSuggestionsAction } from "@/actions/equipmentActions"
import { getUserRoleAction } from "@/actions/authActions"
import { isCustomerRole } from "@/libs/roles"
import EquipmentCard from "@/components/cards/EquipmentCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

// Suggestions should appear after a character or two, without a request per keystroke.
const SUGGESTION_MIN_CHARS = 1
const SUGGESTION_DEBOUNCE_MS = 150

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [canRent, setCanRent] = useState(false)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [availableOnly, setAvailableOnly] = useState(false)
  // rent | sale | both. Equipment can be hired by the day or bought outright.
  const [offer, setOffer] = useState("")

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const searchContainerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const loadRole = async () => {
      const role = await getUserRoleAction()
      setCanRent(isCustomerRole(role))
    }
    loadRole()
  }, [])

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
      if (offer) params.offer = offer

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
  }, [currentPage, search, category, condition, minPrice, maxPrice, availableOnly, offer])

  const handleChange = (setter) => (e) => { setter(e.target.value); setCurrentPage(1) }

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
      const result = await getEquipmentSuggestionsAction(term)
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
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
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
    setHighlightIndex(-1)
    setCurrentPage(1)
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

  const handleReset = () => {
    setSearch(""); setCategory(""); setCondition(""); setOffer("")
    setMinPrice(""); setMaxPrice(""); setAvailableOnly(false)
    setSuggestions([]); setShowSuggestions(false); setHighlightIndex(-1); setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Equipment</h1>
        <p className={styles.subtitle}>
          Hire equipment by the day or buy it outright. Each listing shows which options
          the supplier offers.
        </p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper} ref={searchContainerRef}>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => search && setShowSuggestions(suggestions.length > 0)}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className={styles.suggestionDropdown}>
              {suggestions.map((item, index) => (
                <li
                  key={item.id}
                  className={`${styles.suggestionItem} ${index === highlightIndex ? styles.suggestionItemActive : ""}`}
                  onMouseDown={() => handleSuggestionClick(item.name)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span className={styles.suggestionName}>{item.name}</span>
                  {item.category && <span className={styles.suggestionMeta}>{item.category}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select className={styles.filterSelect} value={offer} onChange={handleChange(setOffer)}>
          <option value="">Rent or buy</option>
          <option value="rent">Available to rent</option>
          <option value="sale">Available to buy</option>
          <option value="both">Both options</option>
        </select>
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
            equipment.map((item) => <EquipmentCard key={item.id} equipment={item} canRent={canRent} />)
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
