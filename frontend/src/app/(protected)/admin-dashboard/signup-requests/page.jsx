"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getSignupRequestsAction,
  approveSignupRequestAction,
  rejectSignupRequestAction,
  deleteSignupRequestAction,
} from "@/actions/signupRequestActions"
import { SIGNUP_ROLES } from "@/libs/roles"
import { getUnassignedAmbulancesAction } from "@/actions/ambulanceActions"
import SignupRequestCard from "@/components/cards/SignupRequestCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

const STATUSES = ["pending", "approved", "rejected"]

export default function AdminSignupRequestsPage() {
  const router = useRouter()

  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [actionId, setActionId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [vehicles, setVehicles] = useState([])

  const [status, setStatus] = useState("pending")
  const [role, setRole] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      setError("")
      const params = { page: currentPage }
      if (status) params.status = status
      if (role) params.role = role
      if (search) params.search = search

      const [result, vehicleResult] = await Promise.all([
        getSignupRequestsAction(params),
        getUnassignedAmbulancesAction(),
      ])

      if (cancelled) return
      if (result.error) {
        setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setRequests(result.data || [])
        setPagination(result.pagination)
      }

      setVehicles(vehicleResult.error ? [] : vehicleResult.data || [])
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [currentPage, status, role, search, refreshKey])

  const runAction = async (id, action) => {
    setActionId(id)
    setError("")
    setMessage("")

    const result = await action()

    setActionId(null)
    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setMessage(result.success)
      setRefreshKey((key) => key + 1)
    }
  }

  const handleApprove = (id, vehicleId) => runAction(id, () => approveSignupRequestAction(id, vehicleId))

  const handleReject = (id, reason) => runAction(id, () => rejectSignupRequestAction(id, reason))

  const handleDelete = (id) => runAction(id, () => deleteSignupRequestAction(id))

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Signup Requests</h1>
      </div>

      <p className={styles.subtitle}>
        Approving a request creates the account plus its pharmacist or vendor profile.
        Applicants cannot log in until then.
      </p>

      <div className={styles.filterBar}>
        <div className={styles.tabs}>
          {STATUSES.map((option) => (
            <button
              key={option}
              className={`${styles.tab} ${status === option ? styles.tabActive : ""}`}
              onClick={() => { setStatus(option); setCurrentPage(1) }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <select className={styles.filterSelect} value={role} onChange={handleFilterChange(setRole)}>
          <option value="">All account types</option>
          {SIGNUP_ROLES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          className={styles.filterInput}
          type="text"
          placeholder="Search by name, email or company..."
          value={search}
          onChange={handleFilterChange(setSearch)}
        />
      </div>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {requests.length > 0 ? (
            requests.map((request) => (
              <SignupRequestCard
                key={request.id}
                request={request}
                busy={actionId === request.id}
                vehicles={vehicles}
                onApprove={(vehicleId) => handleApprove(request.id, vehicleId)}
                onReject={(reason) => handleReject(request.id, reason)}
                onDelete={() => handleDelete(request.id)}
              />
            ))
          ) : (
            <div className={styles.noData}>No {status} signup requests</div>
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
