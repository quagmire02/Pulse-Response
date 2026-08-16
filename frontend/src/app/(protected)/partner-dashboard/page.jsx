"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import { getVendorAction } from "@/actions/vendorActions"
import { getAmbulanceCompanyAction } from "@/actions/ambulanceActions"
import {
  getVendorDashboardAction,
  getAmbulanceDashboardAction,
  getCustomerDashboardAction,
} from "@/actions/partnerDashboardActions"
import { isAdminRole } from "@/libs/roles"
import { ShareBars, DonutChart, TrendBars, StatTile } from "@/components/charts/Charts"
import FulfillmentQueue from "@/components/cards/FulfillmentQueue"
import styles from "./page.module.css"

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // Which specialised view is on screen: vendor, ambulance or customer.
  const [activeDashboard, setActiveDashboard] = useState(null)
  const [availableViews, setAvailableViews] = useState([])
  const [vendorData, setVendorData] = useState(null)
  const [ambulanceData, setAmbulanceData] = useState(null)
  const [customerData, setCustomerData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const id = await getUserIdAction()
        const role = await getUserRoleAction()
        setUserRole(role)

        if (!id) {
          setErrorMsg("Not authenticated.")
          setLoading(false)
          return
        }

        const isAdminUser = isAdminRole(role)
        const vendorCheck = await getVendorAction(id)
        const isVendor = !vendorCheck.error
        const ambulanceCheck = await getAmbulanceCompanyAction(id)
        const isAmbulance = !ambulanceCheck.error

        const views = []
        if (isVendor || isAdminUser) views.push({ value: "vendor", label: "Equipment supplier" })
        if (isAmbulance || isAdminUser) views.push({ value: "ambulance", label: "Ambulance operations" })
        if (!isVendor && !isAmbulance) views.push({ value: "customer", label: "My spending" })
        if (isAdminUser) views.push({ value: "customer", label: "Customer spending" })

        // De-duplicate in case an admin also holds a partner profile.
        const uniqueViews = views.filter(
          (view, index) => views.findIndex((other) => other.value === view.value) === index
        )
        setAvailableViews(uniqueViews)

        const first = uniqueViews[0]?.value || null
        setActiveDashboard(first)
        await loadView(first)

        setLoading(false)
      } catch (err) {
        console.error(err)
        setErrorMsg("Failed to load analytics.")
        setLoading(false)
      }
    }

    load()
  }, [])

  const loadView = async (view) => {
    if (view === "vendor") {
      const result = await getVendorDashboardAction()
      if (result.error) {
        setErrorMsg(typeof result.error === "string" ? result.error : "Failed to load supplier analytics.")
      } else {
        setVendorData(result.data)
      }
    } else if (view === "ambulance") {
      const result = await getAmbulanceDashboardAction()
      if (result.error) {
        setErrorMsg(typeof result.error === "string" ? result.error : "Failed to load fleet analytics.")
      } else {
        setAmbulanceData(result.data)
      }
    } else if (view === "customer") {
      const result = await getCustomerDashboardAction()
      if (result.error) {
        setErrorMsg(typeof result.error === "string" ? result.error : "Failed to load spending analytics.")
      } else {
        setCustomerData(result.data)
      }
    }
  }

  const handleViewChange = async (e) => {
    const value = e.target.value
    setActiveDashboard(value)
    setErrorMsg(null)

    const alreadyLoaded =
      (value === "vendor" && vendorData) ||
      (value === "ambulance" && ambulanceData) ||
      (value === "customer" && customerData)

    if (!alreadyLoaded) {
      setLoading(true)
      await loadView(value)
      setLoading(false)
    }
  }

  const refreshVendor = async () => {
    const result = await getVendorDashboardAction()
    if (!result.error) setVendorData(result.data)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading analytics</p>
        </div>
      </div>
    )
  }

  if (errorMsg && !vendorData && !ambulanceData && !customerData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>{errorMsg}</p>
          <button onClick={() => router.push("/")} className={styles.backButton}>
            Return to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Analytics Dashboard</h1>
          <p className={styles.subtitle}>Real-time business performance and financial monitoring</p>
        </div>

        <div className={styles.controls}>
          {availableViews.length > 1 && (
            <select className={styles.selector} value={activeDashboard} onChange={handleViewChange}>
              {availableViews.map((view) => (
                <option key={view.value} value={view.value}>
                  {view.label}
                </option>
              ))}
            </select>
          )}
          <button onClick={() => router.back()} className={styles.backButton}>
            Back
          </button>
        </div>
      </div>

      {errorMsg && <div className={styles.inlineError}>{errorMsg}</div>}

      {activeDashboard === "vendor" && vendorData && (
        <VendorView data={vendorData} onRefresh={refreshVendor} />
      )}

      {activeDashboard === "ambulance" && ambulanceData && <AmbulanceView data={ambulanceData} />}

      {activeDashboard === "customer" && customerData && <CustomerView data={customerData} />}
    </div>
  )
}

function VendorView({ data, onRefresh }) {
  return (
    <div>
      <div className={styles.partnerInfoCard}>
        <div className={styles.infoDetails}>
          <h2>{data.vendor_info.company_name}</h2>
          <p>{data.vendor_info.description || "Medical equipment supply partner"}</p>
        </div>
        <div className={styles.infoMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>License Number</span>
            <span className={styles.metaValue}>{data.vendor_info.license_num}</span>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatTile label="Total Revenue" value={money(data.total_revenue)} hint="Sales and rentals combined" />
        <StatTile label="Sales Revenue" value={money(data.sale_revenue)} />
        <StatTile label="Rental Revenue" value={money(data.rental_revenue)} />
        <StatTile
          label="Projected Rental Income"
          value={money(data.upcoming_projections)}
          hint="From currently active rentals"
        />
        <StatTile
          label="Average Rating"
          value={`${data.average_rating} / 5.0`}
          hint={`${data.reviews_count} review${data.reviews_count === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Open Handovers"
          value={data.pending_count}
          hint="Requests waiting on you"
        />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Revenue Split</h3>
          <DonutChart data={data.revenue_mix} valuePrefix="$" centerLabel="Revenue" />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Revenue by Category</h3>
          <ShareBars data={data.category_mix} valuePrefix="$" emptyMessage="No completed orders yet" />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Revenue Trend, Last 6 Months</h3>
        <TrendBars data={data.monthly_revenue} valuePrefix="$" />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Top Earning Equipment</h3>
        <ShareBars data={data.top_equipment} valuePrefix="$" emptyMessage="No revenue recorded yet" />
      </div>

      <FulfillmentQueue requests={data.pending_fulfillments} onUpdated={onRefresh} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Live Asset Usage</h3>
        <div className={styles.tableWrapper}>
          {data.asset_usage.length === 0 ? (
            <p className={styles.noData}>No assets found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Listing</th>
                  <th>Total Units</th>
                  <th>On Rent</th>
                  <th>Available</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {data.asset_usage.map((asset) => (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td><span className={styles.badge}>{asset.category}</span></td>
                    <td>
                      {[asset.is_for_rent ? "Rent" : null, asset.is_for_sale ? "Sale" : null]
                        .filter(Boolean)
                        .join(" and ") || "Not listed"}
                    </td>
                    <td>{asset.total_quantity}</td>
                    <td>{asset.rented_quantity}</td>
                    <td>{asset.available_quantity}</td>
                    <td>
                      <div className={styles.inlineBar}>
                        <span>{asset.utilization}%</span>
                        <div className={styles.progressBarContainer}>
                          <div className={styles.progressBar} style={{ width: `${asset.utilization}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Active Rentals</h3>
        <div className={styles.tableWrapper}>
          {data.active_rentals.length === 0 ? (
            <p className={styles.noData}>No active rentals currently.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.active_rentals.map((rental) => (
                  <tr key={rental.id}>
                    <td>{rental.equipment_name}</td>
                    <td>{rental.customer_name}</td>
                    <td>{rental.customer_email}</td>
                    <td>{rental.rental_start}</td>
                    <td>{rental.rental_end}</td>
                    <td>{money(rental.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function AmbulanceView({ data }) {
  return (
    <div>
      <div className={styles.partnerInfoCard}>
        <div className={styles.infoDetails}>
          <h2>{data.company_info.company_name}</h2>
          <p>{data.company_info.description || "Emergency ambulance dispatch partner"}</p>
        </div>
        <div className={styles.infoMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>License Number</span>
            <span className={styles.metaValue}>{data.company_info.license_num}</span>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatTile label="Completed Trips" value={data.completed_trips_count} />
        <StatTile label="Average Response Delay" value={`${data.average_response_delay} min`} />
        <StatTile label="Total Revenue" value={money(data.total_revenue)} />
        <StatTile label="Revenue per Trip" value={money(data.average_revenue_per_trip)} />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Response Delay Distribution</h3>
          <ShareBars data={data.delay_distribution} emptyMessage="No trips recorded yet" />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Fleet Status</h3>
          <DonutChart data={data.fleet_status} centerLabel="Vehicles" />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Revenue Trend, Last 6 Months</h3>
        <TrendBars data={data.monthly_revenue} valuePrefix="$" />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Revenue Share by Vehicle</h3>
        <ShareBars data={data.vehicle_revenue_mix} valuePrefix="$" emptyMessage="No revenue recorded yet" />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Individual Vehicle Efficiency</h3>
        <div className={styles.tableWrapper}>
          {data.vehicle_efficiency.length === 0 ? (
            <p className={styles.noData}>No vehicles found in fleet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Trips</th>
                  <th>Avg Delay</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicle_efficiency.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.vehicle_number}</td>
                    <td>{vehicle.model}</td>
                    <td><span className={`${styles.badge} ${styles[vehicle.status] || ""}`}>{vehicle.status}</span></td>
                    <td>{vehicle.trips_count}</td>
                    <td>{vehicle.average_response_delay} min</td>
                    <td>{money(vehicle.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Completed Trips History</h3>
        <div className={styles.tableWrapper}>
          {data.completed_trips.length === 0 ? (
            <p className={styles.noData}>No trip history available.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Vehicle</th>
                  <th>Dispatch</th>
                  <th>Arrival</th>
                  <th>Completion</th>
                  <th>Delay</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.completed_trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.patient_name || "Emergency Patient"}</td>
                    <td>{trip.vehicle?.vehicle_number || "N/A"}</td>
                    <td>{trip.dispatch_time ? new Date(trip.dispatch_time).toLocaleString() : "N/A"}</td>
                    <td>{trip.arrival_time ? new Date(trip.arrival_time).toLocaleString() : "N/A"}</td>
                    <td>{trip.completion_time ? new Date(trip.completion_time).toLocaleString() : "N/A"}</td>
                    <td>{trip.response_delay_minutes} min</td>
                    <td>{money(trip.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function CustomerView({ data }) {
  return (
    <div>
      <div className={styles.statsGrid}>
        <StatTile label="Total Spend" value={money(data.total_spend)} hint="Excludes cancelled orders" />
        <StatTile label="Orders Placed" value={data.orders_count} />
        <StatTile label="Active Rentals" value={data.active_rentals} />
        <StatTile label="Open Handovers" value={data.open_handovers} hint="Awaiting vendor confirmation" />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Where Your Money Goes</h3>
          <DonutChart data={data.spend_mix} valuePrefix="$" centerLabel="Total Spend" />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Spend Split</h3>
          <ShareBars data={data.spend_mix} valuePrefix="$" emptyMessage="No orders placed yet" />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Monthly Spend, Last 6 Months</h3>
        <TrendBars data={data.monthly_spend} valuePrefix="$" />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Equipment Categories</h3>
          <ShareBars data={data.category_mix} valuePrefix="$" emptyMessage="No equipment ordered yet" />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Most Purchased Items</h3>
          <ShareBars data={data.top_items} valuePrefix="$" emptyMessage="No orders placed yet" />
        </div>
      </div>
    </div>
  )
}
