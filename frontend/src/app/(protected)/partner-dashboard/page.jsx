"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import { getVendorAction } from "@/actions/vendorActions"
import { getAmbulanceCompanyAction } from "@/actions/ambulanceActions"
import {
  getVendorDashboardAction,
  getAmbulanceDashboardAction,
} from "@/actions/partnerDashboardActions"
import styles from "./page.module.css"

export default function PartnerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [userRole, setUserRole] = useState(null)
  
  // Dashboard modes: 'vendor' or 'ambulance'
  const [activeDashboard, setActiveDashboard] = useState(null)
  const [vendorData, setVendorData] = useState(null)
  const [ambulanceData, setAmbulanceData] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      try {
        const id = await getUserIdAction()
        const role = await getUserRoleAction()
        setUserRole(role)

        if (!id) {
          setErrorMsg("Not authenticated.")
          setLoading(false)
          return
        }

        const isAdminUser = role === "admin" || role === "super_admin"
        
        // Check vendor profile
        const vendorCheck = await getVendorAction(id)
        const isVendor = !vendorCheck.error

        // Check ambulance profile
        const ambulanceCheck = await getAmbulanceCompanyAction(id)
        const isAmbulance = !ambulanceCheck.error

        if (!isVendor && !isAmbulance && !isAdminUser) {
          setErrorMsg("Access denied. This dashboard is only available to platform partners and administrators.")
          setLoading(false)
          return
        }

        setAuthorized(true)

        // Set default active dashboard
        let defaultDash = null
        if (isVendor) {
          defaultDash = "vendor"
        } else if (isAmbulance) {
          defaultDash = "ambulance"
        } else if (isAdminUser) {
          defaultDash = "vendor" // Admin default
        }
        setActiveDashboard(defaultDash)

        // Fetch corresponding metrics
        if (defaultDash === "vendor" || isAdminUser) {
          const vResult = await getVendorDashboardAction()
          if (!vResult.error) {
            setVendorData(vResult.data)
          }
        }
        if (defaultDash === "ambulance" || isAdminUser) {
          const aResult = await getAmbulanceDashboardAction()
          if (!aResult.error) {
            setAmbulanceData(aResult.data)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error(err)
        setErrorMsg("Failed to load dashboard metrics.")
        setLoading(false)
      }
    }

    checkAccessAndFetch()
  }, [])

  const handleDashboardChange = async (e) => {
    const value = e.target.value
    setActiveDashboard(value)
    if (value === "vendor" && !vendorData) {
      setLoading(true)
      const vResult = await getVendorDashboardAction()
      if (!vResult.error) {
        setVendorData(vResult.data)
      }
      setLoading(false)
    } else if (value === "ambulance" && !ambulanceData) {
      setLoading(true)
      const aResult = await getAmbulanceDashboardAction()
      if (!aResult.error) {
        setAmbulanceData(aResult.data)
      }
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing financial operations...</p>
        </div>
      </div>
    )
  }

  if (!authorized || errorMsg) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>⚠️ {errorMsg || "Unauthorized Access"}</p>
          <button onClick={() => router.push("/")} className={styles.backButton}>
            Return to Homepage
          </button>
        </div>
      </div>
    )
  }

  const isAdminOrSuper = userRole === "admin" || userRole === "super_admin"

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Partner Analytics</h1>
          <p className={styles.subtitle}>Real-time business performance and financial monitoring</p>
        </div>
        
        <div className={styles.controls}>
          {isAdminOrSuper && (
            <select
              className={styles.selector}
              value={activeDashboard}
              onChange={handleDashboardChange}
            >
              <option value="vendor">Equipment Suppliers Dashboard</option>
              <option value="ambulance">Ambulance Companies Dashboard</option>
            </select>
          )}
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
        </div>
      </div>

      {activeDashboard === "vendor" && vendorData && (
        <div>
          {/* Vendor profile details */}
          <div className={styles.partnerInfoCard}>
            <div className={styles.infoDetails}>
              <h2>🏪 {vendorData.vendor_info.company_name}</h2>
              <p>{vendorData.vendor_info.description || "Medical equipment supply partner"}</p>
            </div>
            <div className={styles.infoMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>License Number</span>
                <span className={styles.metaValue}>{vendorData.vendor_info.license_num}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>💰</span>
              <span className={styles.statLabel}>Projected Revenue</span>
              <span className={styles.statValue}>${parseFloat(vendorData.upcoming_projections).toFixed(2)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⭐</span>
              <span className={styles.statLabel}>Average Rating</span>
              <span className={styles.statValue}>{vendorData.average_rating} / 5.0</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📦</span>
              <span className={styles.statLabel}>Total Reviews</span>
              <span className={styles.statValue}>{vendorData.reviews_count}</span>
            </div>
          </div>

          {/* Live Asset Usage */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📋 Live Asset Usage</h3>
            <div className={styles.tableWrapper}>
              {vendorData.asset_usage.length === 0 ? (
                <p className={styles.noData}>No assets found.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Equipment Name</th>
                      <th>Category</th>
                      <th>Total Quantity</th>
                      <th>Rented Units</th>
                      <th>Available Units</th>
                      <th>Utilization Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorData.asset_usage.map((asset) => {
                      const utilRate = asset.total_quantity > 0 
                        ? Math.round((asset.rented_quantity / asset.total_quantity) * 100)
                        : 0;
                      return (
                        <tr key={asset.id}>
                          <td>{asset.name}</td>
                          <td><span className={`${styles.badge} ${styles.available}`}>{asset.category}</span></td>
                          <td>{asset.total_quantity}</td>
                          <td>{asset.rented_quantity}</td>
                          <td>{asset.available_quantity}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span>{utilRate}%</span>
                              <div className={styles.progressBarContainer} style={{ width: "80px", marginTop: 0 }}>
                                <div className={styles.progressBar} style={{ width: `${utilRate}%` }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Active Rentals */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🔑 Active Rentals</h3>
            <div className={styles.tableWrapper}>
              {vendorData.active_rentals.length === 0 ? (
                <p className={styles.noData}>No active rentals currently.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Customer Name</th>
                      <th>Customer Email</th>
                      <th>Rental Start</th>
                      <th>Rental End</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorData.active_rentals.map((rental) => (
                      <tr key={rental.id}>
                        <td>{rental.equipment_name}</td>
                        <td>{rental.customer_name}</td>
                        <td>{rental.customer_email}</td>
                        <td>{rental.rental_start}</td>
                        <td>{rental.rental_end}</td>
                        <td>${parseFloat(rental.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeDashboard === "ambulance" && ambulanceData && (
        <div>
          {/* Ambulance profile details */}
          <div className={styles.partnerInfoCard}>
            <div className={styles.infoDetails}>
              <h2>🚑 {ambulanceData.company_info.company_name}</h2>
              <p>{ambulanceData.company_info.description || "Emergency ambulance dispatch partner"}</p>
            </div>
            <div className={styles.infoMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>License Number</span>
                <span className={styles.metaValue}>{ambulanceData.company_info.license_num}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🏁</span>
              <span className={styles.statLabel}>Completed Trips</span>
              <span className={styles.statValue}>{ambulanceData.completed_trips_count}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⏱️</span>
              <span className={styles.statLabel}>Avg Response Delay</span>
              <span className={styles.statValue}>{ambulanceData.average_response_delay} mins</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>💰</span>
              <span className={styles.statLabel}>Total Revenue</span>
              <span className={styles.statValue}>${parseFloat(ambulanceData.total_revenue).toFixed(2)}</span>
            </div>
          </div>

          {/* Vehicle Efficiency */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⚡ Individual Vehicle Efficiency</h3>
            <div className={styles.tableWrapper}>
              {ambulanceData.vehicle_efficiency.length === 0 ? (
                <p className={styles.noData}>No vehicles found in fleet.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Vehicle Number</th>
                      <th>Model</th>
                      <th>Status</th>
                      <th>Completed Trips</th>
                      <th>Avg Delay</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambulanceData.vehicle_efficiency.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>{vehicle.vehicle_number}</td>
                        <td>{vehicle.model}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[vehicle.status]}`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td>{vehicle.trips_count}</td>
                        <td>{vehicle.average_response_delay} mins</td>
                        <td>${parseFloat(vehicle.total_revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Completed Trips */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📜 Completed Trips History</h3>
            <div className={styles.tableWrapper}>
              {ambulanceData.completed_trips.length === 0 ? (
                <p className={styles.noData}>No trip history available.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Vehicle Number</th>
                      <th>Dispatch Time</th>
                      <th>Arrival Time</th>
                      <th>Completion Time</th>
                      <th>Response Delay</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambulanceData.completed_trips.map((trip) => {
                      const dispatchDate = new Date(trip.dispatch_time).toLocaleString()
                      const arrivalDate = new Date(trip.arrival_time).toLocaleString()
                      const completionDate = new Date(trip.completion_time).toLocaleString()
                      return (
                        <tr key={trip.id}>
                          <td>{trip.patient_name || "Emergency Patient"}</td>
                          <td>{trip.vehicle?.vehicle_number || "N/A"}</td>
                          <td>{dispatchDate}</td>
                          <td>{arrivalDate}</td>
                          <td>{completionDate}</td>
                          <td>{trip.response_delay_minutes} mins</td>
                          <td>${parseFloat(trip.revenue).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
