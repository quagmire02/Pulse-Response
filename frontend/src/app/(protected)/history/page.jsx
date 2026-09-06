"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getLedgerTimelineAction, getLedgerSummaryAction, triggerEmergencyAlertAction } from "@/actions/ledgerActions"
import { getConsultationsAction } from "@/actions/consultationActions"
import { getUserRoleAction } from "@/actions/authActions"
import TimelineCard from "@/components/cards/TimelineCard"
import AmbulanceTracker from "@/components/map/AmbulanceTracker"
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css"

export default function HistoryPage() {
  const router = useRouter()
  const [role, setRole] = useState(null)

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

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [alertType, setAlertType] = useState("general_ambulance")
  const [location, setLocation] = useState("")

  const [coords, setCoords] = useState(null)
  const [notes, setNotes] = useState("")
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencySuccess, setEmergencySuccess] = useState("")
  const [emergencyError, setEmergencyError] = useState("")

  const [consultations, setConsultations] = useState([])
  const [consultationsLoading, setConsultationsLoading] = useState(false)
  const [consultationsPagination, setConsultationsPagination] = useState(null)
  const [consultationsPage, setConsultationsPage] = useState(1)

  const isDoctor = role === "admin" || role === "super_admin" || role === "pharmacist"

  const loadSummary = async () => {
    const result = await getLedgerSummaryAction()
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

      const result = await getLedgerTimelineAction(params)
      if (result.error) {
        setError(result.error)
      } else {
        setTimeline(result.data || [])
        setTotalPages(result.pagination?.total_pages || 1)
      }
    } catch (err) {
      setError("Failed to load timeline ledger.")
    } finally {
      setLoading(false)
    }
  }

  const loadConsultations = async () => {
    setConsultationsLoading(true)
    try {
      const result = await getConsultationsAction({ page: consultationsPage })
      if (!result.error) {
        setConsultations(result.data || [])
        setConsultationsPagination(result.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setConsultationsLoading(false)
    }
  }

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const result = await getUserRoleAction()
        if (!result.error) {
          setRole(result)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUserRole()
  }, [])

  useEffect(() => {
    if (activeTab === "consultations_list") {
      loadConsultations()
    } else {
      loadTimeline()
    }
  }, [currentPage, activeTab, fromDate, toDate, consultationsPage])

  useEffect(() => {
    loadSummary()
  }, [activeTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleDateFilterReset = () => {
    setFromDate("")
    setToDate("")
    setCurrentPage(1)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setEmergencyError("This browser does not support location access.")
      return
    }

    setEmergencyError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        if (!location) {
          setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        }
      },
      (err) => setEmergencyError(`Could not read your location: ${err.message}`),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const handleTriggerEmergency = async (e) => {
    e.preventDefault()
    if (!location) {
      setEmergencyError("Please provide your location.")
      return
    }
    setEmergencyLoading(true)
    setEmergencyError("")
    setEmergencySuccess("")

    const result = await triggerEmergencyAlertAction({
      alert_type: alertType,
      location,
      notes,
      ...(coords && { latitude: coords.latitude, longitude: coords.longitude }),
    })

    setEmergencyLoading(false)
    if (result.error) {
      setEmergencyError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      const dispatch = result.dispatch
      setEmergencySuccess(
        dispatch
          ? `Ambulance ${dispatch.vehicle_number} dispatched. About ${dispatch.eta_minutes} minutes away (${dispatch.distance_km} km).`
          : "Emergency alert logged. No ambulance is online right now, an operator will follow up."
      )
      setLocation("")
      setCoords(null)
      setNotes("")
      loadSummary()
      if (activeTab === "all" || activeTab === "emergency") {
        loadTimeline()
      }
      setTimeout(() => {
        setShowEmergencyModal(false)
        setEmergencySuccess("")
      }, 1500)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Unified Medical & Order Ledger</h1>
          <p className={styles.subtitle}>Secure, aggregated history of medicine purchases, consultations, rentals, and alerts.</p>
        </div>
        <button className={styles.emergencyBtn} onClick={() => setShowEmergencyModal(true)}>
          🚨 Trigger Emergency Alert
        </button>
      </div>

      <AmbulanceTracker />

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
            <span className={styles.statLabel}>Equipment Rentals</span>
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
            <span className={styles.statLabel}>Emergency Alerts</span>
            <strong className={styles.statValue}>{summary.total_alerts}</strong>
          </div>
        </div>
      </div>

      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`} onClick={() => handleTabChange("all")}>All Logs</button>
          <button className={`${styles.tab} ${activeTab === "purchase" ? styles.activeTab : ""}`} onClick={() => handleTabChange("purchase")}>Medicine Purchases</button>
          <button className={`${styles.tab} ${activeTab === "equipment_purchase" ? styles.activeTab : ""}`} onClick={() => handleTabChange("equipment_purchase")}>Equipment Purchases</button>
          <button className={`${styles.tab} ${activeTab === "equipment" ? styles.activeTab : ""}`} onClick={() => handleTabChange("equipment")}>Equipment Rentals</button>
          <button className={`${styles.tab} ${activeTab === "consultation" ? styles.activeTab : ""}`} onClick={() => handleTabChange("consultation")}>Doctor Visits</button>
          <button className={`${styles.tab} ${activeTab === "emergency" ? styles.activeTab : ""}`} onClick={() => handleTabChange("emergency")}>Emergency Alerts</button>
          <button className={`${styles.tab} ${activeTab === "payment" ? styles.activeTab : ""}`} onClick={() => handleTabChange("payment")}>Payment Receipts</button>
          {isDoctor && (
            <button className={`${styles.tab} ${activeTab === "consultations_list" ? styles.activeTab : ""}`} onClick={() => handleTabChange("consultations_list")}>
              My Patients Portal 🧑‍⚕️
            </button>
          )}
        </div>
      </div>

      {activeTab !== "consultations_list" ? (
        <>

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

          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <div className={styles.loading}>Aggregating your ledger timeline...</div>
          ) : (
            <div className={styles.timelineList}>
              {timeline.length > 0 ? (
                timeline.map((item) => (
                  <TimelineCard key={`${item.type}-${item.id}`} item={item} />
                ))
              ) : (
                <div className={styles.emptyTimeline}>
                  <p>No activity logs found for the selected filters.</p>
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
      ) : (

        <div className={styles.patientsPortal}>
          <h2>My Consultation Logs & Patients</h2>
          <p className={styles.patientsSubtitle}>Securely review medical ledgers of patients who booked consultation slots with you.</p>

          {consultationsLoading ? (
            <div className={styles.loading}>Loading consultations...</div>
          ) : (
            <div className={styles.patientsTableWrapper}>
              {consultations.length > 0 ? (
                <table className={styles.patientsTable}>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>Scheduled Date</th>
                      <th>Consultation Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map((consultation) => {
                      const patient = consultation.user
                      return (
                        <tr key={consultation.id}>
                          <td>
                            <strong>
                              {patient ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() : "Unknown"}
                            </strong>
                            <div className={styles.username}>@{patient?.username || "username"}</div>
                          </td>
                          <td>{patient?.email || "N/A"}</td>
                          <td>
                            {consultation.slot?.date ? new Date(consultation.slot.date).toLocaleDateString() : "N/A"}
                            <span className={styles.slotTime}>
                              {consultation.slot ? ` (${consultation.slot.start_time}:00 ${consultation.slot.start_period})` : ""}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusLabel} ${styles[consultation.status]}`}>
                              {consultation.status}
                            </span>
                          </td>
                          <td>
                            {patient && (
                              <button
                                className={styles.viewLedgerBtn}
                                onClick={() => router.push(`/history/patient/${patient.id}`)}
                              >
                                View Patient Ledger ➔
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyTimeline}>
                  <p>No patient consultations registered yet.</p>
                </div>
              )}
            </div>
          )}

          {consultationsPagination && consultationsPagination.total_pages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={consultationsPage}
                totalPages={consultationsPagination.total_pages}
                onPageChange={setConsultationsPage}
              />
            </div>
          )}
        </div>
      )}

      {showEmergencyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>🚨 Trigger Dispatch & Emergency Alert</h3>
              <button className={styles.closeBtn} onClick={() => setShowEmergencyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTriggerEmergency} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Emergency Type:</label>
                <select value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                  <option value="general_ambulance">General Ambulance Request</option>
                  <option value="heart_attack_symptoms">Cardiac Emergency / Heart Symptoms</option>
                  <option value="respiratory_asthma">Severe Breathing Difficulty / Asthma</option>
                  <option value="trauma_physical_injury">Severe Physical Injury / Trauma</option>
                  <option value="emergency_prescription_refill">Urgent Medicine Request</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Current Location Address:</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Apartment 4B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <button type="button" onClick={handleUseMyLocation} className={styles.locateBtn}>
                  Use my current location
                </button>
                {coords && (
                  <span className={styles.coordsHint}>
                    GPS attached: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}. The
                    nearest available ambulance will be dispatched automatically.
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Additional Notes / Medical Context:</label>
                <textarea
                  placeholder="Describe details (e.g., patient is conscious but chest is tight, medicine allergies, age)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {emergencyError && <div className={styles.modalError}>{emergencyError}</div>}
              {emergencySuccess && <div className={styles.modalSuccess}>{emergencySuccess}</div>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowEmergencyModal(false)}>Cancel</button>
                <button type="submit" className={styles.confirmEmergencyBtn} disabled={emergencyLoading}>
                  {emergencyLoading ? "Dispatching..." : "🚨 Dispatch Assistance Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
