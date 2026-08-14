"use client"

import { useState, useEffect } from "react"
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

  const handleReset = () => {
    setSearch(""); setCategory(""); setCondition("")
    setMinPrice(""); setMaxPrice(""); setAvailableOnly(false); setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Equipment</h1>
      </div>

      <div className={styles.filterBar}>
        <input className={styles.filterInput} type="text" placeholder="Search by name or category..." value={search} onChange={handleChange(setSearch)} />
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
