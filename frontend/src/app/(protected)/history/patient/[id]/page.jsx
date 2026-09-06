"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getPatientTimelineAction, getPatientSummaryAction } from "@/actions/ledgerActions"
import { getUserAction } from "@/actions/userActions"
import { getUserRoleAction } from "@/actions/authActions"
import TimelineCard from "@/components/cards/TimelineCard"
import Pagination from "@/components/paginations/Pagination"
import styles from "../../page.module.css"

export default function PatientHistoryPage() {
  const { id: patientId } = useParams()
  const router = useRouter()

  const [role, setRole] = useState(null)
  const [patientUser, setPatientUser] = useState(null)

  // Ledger stats & list
  const [timeline, setTimeline] = useState([])
  const [summary, setSummary] = useState({
    total_purchases: 0,
    total_equipment_purchases: 0,
    total_rentals: 0,
    total_consultations: 0,
    total_alerts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("all") // all, purchase, equipment, consultation, emergency, payment
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const loadPatientInfo = async () => {
    try {
      const result = await getUserAction(patientId)
      if (!result.error && result.data) {
        setPatientUser(result.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadSummary = async () => {
    const result = await getPatientSummaryAction(patientId)
    if (!result.error && result.data) {
      setSummary(result.data)
    }
  }

  const loadTimeline = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: currentPage,
        type: activeTab,
      }
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate

      const result = await getPatientTimelineAction(patientId, params)
      if (result.error) {
        setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setTimeline(result.data || [])
        setTotalPages(result.pagination?.total_pages || 1)
      }
    } catch (err) {
      setError("Failed to load patient timeline ledger.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const result = await getUserRoleAction()
        if (!result.error) {
          setRole(result)
          if (result !== "admin" && result !== "super_admin" && result !== "pharmacist") {
            setError("Access Denied: Only approved medical staff can view patient history.")
            setLoading(false)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    checkAccess()
    loadPatientInfo()
  }, [patientId])

  useEffect(() => {
    if (role === "admin" || role === "super_admin" || role === "pharmacist") {
      loadTimeline()
    }
  }, [currentPage, activeTab, fromDate, toDate, role])

  useEffect(() => {
    if (role === "admin" || role === "super_admin" || role === "pharmacist") {
      loadSummary()
    }
  }, [activeTab, role])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleDateFilterReset = () => {
    setFromDate("")
    setToDate("")
    setCurrentPage(1)
  }

  const patientName = patientUser
    ? `${patientUser.first_name || ""} ${patientUser.last_name || ""}`.trim() || patientUser.username
    : "Patient"

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button onClick={() => router.push("/history")} className={styles.resetFilterBtn} style={{ marginBottom: "1rem" }}>
            ← Back to Portal
          </button>
          <h1 className={styles.title}>Medical Ledger: {patientName}</h1>
          <p className={styles.subtitle}>Reviewing complete aggregated medical history, orders, and logs for patient.</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!error && (
        <>
          {/* Summary Cards */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.purc}`}>
              <div className={styles.statIcon}>💊</div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>Medicine Purchases</span>
                <strong className={styles.statValue}>{summary.total_purchases}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.equip}`}>
              <div className={styles.statIcon}>🛒</div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>Equipment Purchases</span>
                <strong className={styles.statValue}>{summary.total_equipment_purchases}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.rent}`}>
              <div className={styles.statIcon}>🏥</div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>Rentals</span>
                <strong className={styles.statValue}>{summary.total_rentals}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.cons}`}>
              <div className={styles.statIcon}>🩺</div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>Consultations</span>
                <strong className={styles.statValue}>{summary.total_consultations}</strong>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.aler}`}>
              <div className={styles.statIcon}>🚨</div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>Emergencies</span>
                <strong className={styles.statValue}>{summary.total_alerts}</strong>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className={styles.tabsWrapper}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`} onClick={() => handleTabChange("all")}>All Logs</button>
              <button className={`${styles.tab} ${activeTab === "purchase" ? styles.activeTab : ""}`} onClick={() => handleTabChange("purchase")}>Medicine Purchases</button>
              <button className={`${styles.tab} ${activeTab === "equipment_purchase" ? styles.activeTab : ""}`} onClick={() => handleTabChange("equipment_purchase")}>Equipment Purchases</button>
              <button className={`${styles.tab} ${activeTab === "equipment" ? styles.activeTab : ""}`} onClick={() => handleTabChange("equipment")}>Equipment Rentals</button>
              <button className={`${styles.tab} ${activeTab === "consultation" ? styles.activeTab : ""}`} onClick={() => handleTabChange("consultation")}>Doctor Visits</button>
              <button className={`${styles.tab} ${activeTab === "emergency" ? styles.activeTab : ""}`} onClick={() => handleTabChange("emergency")}>Emergency Alerts</button>
              <button className={`${styles.tab} ${activeTab === "payment" ? styles.activeTab : ""}`} onClick={() => handleTabChange("payment")}>Payment Receipts</button>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.dateFilterGroup}>
              <label>From Date:</label>
              <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className={styles.dateFilterGroup}>
              <label>To Date:</label>
              <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }} />
            </div>
            {(fromDate || toDate) && (
              <button className={styles.resetFilterBtn} onClick={handleDateFilterReset}>Reset Dates</button>
            )}
          </div>

          {loading ? (
            <div className={styles.loading}>Retrieving patient ledger timeline...</div>
          ) : (
            <div className={styles.timelineList}>
              {timeline.length > 0 ? (
                timeline.map((item) => (
                  <TimelineCard key={`${item.type}-${item.id}`} item={item} />
                ))
              ) : (
                <div className={styles.emptyTimeline}>
                  <p>No activity logs found for this patient.</p>
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
