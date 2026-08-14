"use client"

import { useState, useEffect } from "react"
import { getVendorsAction } from "@/actions/vendorActions"
import VendorCard from "@/components/cards/VendorCard"
import Pagination from "@/components/paginations/Pagination"
import CreateVendorModal from "@/components/modals/CreateVendorModal"
import styles from "./page.module.css"

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      setError("")
      const params = { page: currentPage }
      if (search) params.search = search
      const result = await getVendorsAction(params)
      if (cancelled) return
      if (result.error) {
        setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setVendors(result.data || [])
        setPagination(result.pagination)
      }
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [currentPage, search])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vendors</h1>
        <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>+ Add Vendor</button>
      </div>

      <div className={styles.filterBar}>
        <input
          className={styles.filterInput}
          type="text"
          placeholder="Search by company or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {vendors.length > 0 ? (
            vendors.map((v) => <VendorCard key={v.id} vendor={v} />)
          ) : (
            <div className={styles.noData}>No vendors found</div>
          )}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination currentPage={currentPage} totalPages={pagination.total_pages} onPageChange={setCurrentPage} />
        </div>
      )}

      {showCreateModal && (
        <CreateVendorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); setCurrentPage(1) }}
        />
      )}
    </div>
  )
}
