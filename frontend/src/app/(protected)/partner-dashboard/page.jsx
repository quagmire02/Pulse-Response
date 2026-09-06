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
  getPharmacyDashboardAction,
} from "@/actions/partnerDashboardActions"
import { getVolunteerStatsAction } from "@/actions/volunteerActions"
import { isAdminRole } from "@/libs/roles"
import { ShareBars, DonutChart, TrendBars, StatTile } from "@/components/charts/Charts"
import FulfillmentQueue from "@/components/cards/FulfillmentQueue"
import { PageShell, Section, Alert, EmptyState, Loading, errorText } from "@/components/layout/PageShell"

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`

export default function AnalyticsDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const [activeView, setActiveView] = useState(null)
  const [views, setViews] = useState([])
  const [data, setData] = useState({})

  useEffect(() => {
    const load = async () => {
      const id = await getUserIdAction()
      const role = await getUserRoleAction()

      if (!id) {
        setErrorMsg("Not authenticated.")
        setLoading(false)
        return
      }

      const isAdmin = isAdminRole(role)

      const [vendorCheck, ambulanceCheck, volunteerCheck] = await Promise.all([
        getVendorAction(id),
        getAmbulanceCompanyAction(id),
        getVolunteerStatsAction(),
      ])

      const available = []
      // Pharmacists had no view at all, so a medicine selling never showed up
      // anywhere. Theirs goes first because it is the only one they have.
      if (role === "pharmacist" || isAdmin) {
        available.push({ value: "pharmacy", label: "Pharmacy sales" })
      }
      if (!vendorCheck.error || isAdmin) available.push({ value: "vendor", label: "Equipment supplier" })
      if (!ambulanceCheck.error || isAdmin) available.push({ value: "ambulance", label: "Ambulance operations" })
      if (!volunteerCheck.error) available.push({ value: "volunteer", label: "My volunteering" })
      available.push({ value: "customer", label: isAdmin ? "Customer spending" : "My spending" })

      const unique = available.filter(
        (view, index) => available.findIndex((other) => other.value === view.value) === index
      )

      setViews(unique)

      const first = unique[0]?.value || null
      setActiveView(first)
      if (first) await loadView(first)

      setLoading(false)
    }

    load()
  }, [])

  const loadView = async (view) => {
    const loaders = {
      vendor: getVendorDashboardAction,
      ambulance: getAmbulanceDashboardAction,
      customer: getCustomerDashboardAction,
      pharmacy: getPharmacyDashboardAction,
      volunteer: getVolunteerStatsAction,
    }

    const result = await loaders[view]()

    if (result.error) {
      setErrorMsg(errorText(result.error, "Could not load that view."))
      return
    }

    setErrorMsg(null)
    setData((current) => ({ ...current, [view]: result.data }))
  }

  const switchView = async (view) => {
    setActiveView(view)
    setErrorMsg(null)

    if (!data[view]) {
      setLoading(true)
      await loadView(view)
      setLoading(false)
    }
  }

  const refresh = async () => {
    if (activeView) await loadView(activeView)
  }

  if (loading && !activeView) {
    return (
      <PageShell title="Analytics" showBack={false}>
        <Loading label="Loading analytics" />
      </PageShell>
    )
  }

  const current = data[activeView]

  return (
    <PageShell
      eyebrow="Insights"
      title="Analytics Dashboard"
      subtitle="Live performance for whichever role you hold on the platform."
      wide
      actions={
        views.length > 1 && (
          <div className="pr-toolbar" style={{ margin: 0, padding: 6 }}>
            {views.map((view) => (
              <button
                key={view.value}
                className={`pr-btn pr-btn-sm ${
                  activeView === view.value ? "pr-btn-primary" : "pr-btn-ghost"
                }`}
                onClick={() => switchView(view.value)}
              >
                {view.label}
              </button>
            ))}
          </div>
        )
      }
    >
      <Alert kind="error">{errorMsg}</Alert>

      {loading && <Loading label="Loading view" />}

      {!loading && !current && <EmptyState>Nothing to show for this view yet.</EmptyState>}

      {!loading && current && activeView === "pharmacy" && <PharmacyView data={current} />}

      {!loading && current && activeView === "vendor" && (
        <VendorView data={current} onRefresh={refresh} />
      )}
      {!loading && current && activeView === "ambulance" && <AmbulanceView data={current} />}
      {!loading && current && activeView === "customer" && <CustomerView data={current} />}
      {!loading && current && activeView === "volunteer" && <VolunteerView data={current} />}
    </PageShell>
  )
}

function ProfileBanner({ title, subtitle, meta }) {
  return (
    <div
      className="pr-card"
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 18,
        flexWrap: "wrap",
        alignItems: "center",
        background: "linear-gradient(120deg, #0b79d4, #12a594)",
        border: "none",
        color: "#fff",
        marginBottom: 24,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#fff" }}>{title}</h2>
        <p style={{ margin: "6px 0 0", opacity: 0.9, fontSize: "0.92rem" }}>{subtitle}</p>
      </div>
      {meta && (
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.85 }}>
            {meta.label}
          </span>
          <div style={{ fontSize: "1.15rem", fontWeight: 800 }}>{meta.value}</div>
        </div>
      )}
    </div>
  )
}

function VendorView({ data, onRefresh }) {
  return (
    <>
      <ProfileBanner
        title={data.vendor_info.company_name}
        subtitle={data.vendor_info.description || "Medical equipment supply partner"}
        meta={{ label: "Licence", value: data.vendor_info.license_num }}
      />

      <div className="pr-stats">
        <StatTile label="Total revenue" value={money(data.total_revenue)} hint="Sales and rentals" />
        <StatTile label="Sales" value={money(data.sale_revenue)} />
        <StatTile label="Rentals" value={money(data.rental_revenue)} />
        <StatTile label="Projected" value={money(data.upcoming_projections)} hint="Active rentals" />
        <StatTile
          label="Rating"
          value={`${data.average_rating} / 5`}
          hint={`${data.reviews_count} review${data.reviews_count === 1 ? "" : "s"}`}
        />
        <StatTile label="Open handovers" value={data.pending_count} hint="Waiting on you" />
      </div>

      <div className="pr-grid pr-grid-wide" style={{ marginBottom: 28 }}>
        <div className="pr-card">
          <h3 className="pr-section-title">Revenue split</h3>
          <p className="pr-section-hint">Where your income comes from.</p>
          <DonutChart data={data.revenue_mix} valuePrefix="$" centerLabel="Revenue" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">By category</h3>
          <p className="pr-section-hint">Which equipment types earn most.</p>
          <ShareBars data={data.category_mix} valuePrefix="$" emptyMessage="No completed orders yet" />
        </div>
      </div>

      <Section title="Revenue trend" hint="Last six months.">
        <div className="pr-card">
          <TrendBars data={data.monthly_revenue} valuePrefix="$" />
        </div>
      </Section>

      <Section title="Top earning equipment">
        <div className="pr-card">
          <ShareBars data={data.top_equipment} valuePrefix="$" emptyMessage="No revenue recorded yet" />
        </div>
      </Section>

      <FulfillmentQueue requests={data.pending_fulfillments} onUpdated={onRefresh} />

      <Section title="Live asset usage">
        {data.asset_usage.length === 0 ? (
          <EmptyState>No equipment listed yet.</EmptyState>
        ) : (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Listing</th>
                  <th>Units</th>
                  <th>On rent</th>
                  <th>Available</th>
                  <th>Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {data.asset_usage.map((asset) => (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td><span className="pr-badge pr-badge-primary">{asset.category}</span></td>
                    <td>
                      {[asset.is_for_rent && "Rent", asset.is_for_sale && "Sale"]
                        .filter(Boolean)
                        .join(" and ") || "Not listed"}
                    </td>
                    <td>{asset.total_quantity}</td>
                    <td>{asset.rented_quantity}</td>
                    <td>{asset.available_quantity}</td>
                    <td>{asset.utilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Active rentals">
        {data.active_rentals.length === 0 ? (
          <EmptyState>No active rentals right now.</EmptyState>
        ) : (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Customer</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.active_rentals.map((rental) => (
                  <tr key={rental.id}>
                    <td>{rental.equipment_name}</td>
                    <td>{rental.customer_name || rental.customer_email}</td>
                    <td>{rental.rental_start}</td>
                    <td>{rental.rental_end}</td>
                    <td>{money(rental.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}

function AmbulanceView({ data }) {
  return (
    <>
      <ProfileBanner
        title={data.company_info.company_name}
        subtitle={data.company_info.description || "Emergency ambulance partner"}
        meta={{ label: "Licence", value: data.company_info.license_num }}
      />

      <div className="pr-stats">
        <StatTile label="Completed trips" value={data.completed_trips_count} />
        <StatTile label="Avg response" value={`${data.average_response_delay} min`} />
        <StatTile label="Total revenue" value={money(data.total_revenue)} />
        <StatTile label="Per trip" value={money(data.average_revenue_per_trip)} />
      </div>

      <div className="pr-grid pr-grid-wide" style={{ marginBottom: 28 }}>
        <div className="pr-card">
          <h3 className="pr-section-title">Response delay spread</h3>
          <p className="pr-section-hint">Where the slow tail is.</p>
          <ShareBars data={data.delay_distribution} emptyMessage="No trips recorded yet" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">Fleet status</h3>
          <p className="pr-section-hint">Vehicles by current state.</p>
          <DonutChart data={data.fleet_status} centerLabel="Vehicles" />
        </div>
      </div>

      <Section title="Revenue trend" hint="Last six months.">
        <div className="pr-card">
          <TrendBars data={data.monthly_revenue} valuePrefix="$" />
        </div>
      </Section>

      <Section title="Revenue share by vehicle">
        <div className="pr-card">
          <ShareBars data={data.vehicle_revenue_mix} valuePrefix="$" emptyMessage="No revenue yet" />
        </div>
      </Section>

      <Section title="Vehicle efficiency">
        {data.vehicle_efficiency.length === 0 ? (
          <EmptyState>No vehicles in the fleet.</EmptyState>
        ) : (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Trips</th>
                  <th>Avg delay</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicle_efficiency.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.vehicle_number}</td>
                    <td>{vehicle.model}</td>
                    <td><span className="pr-badge">{vehicle.status}</span></td>
                    <td>{vehicle.trips_count}</td>
                    <td>{vehicle.average_response_delay} min</td>
                    <td>{money(vehicle.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}

function PharmacyView({ data }) {
  const needsAttention = (data.out_of_stock_count || 0) + (data.low_stock_count || 0)

  return (
    <>
      <div className="pr-stats">
        <StatTile label="Medicine revenue" value={money(data.total_revenue)} hint="Excludes cancelled orders" />
        <StatTile label="Units dispensed" value={data.units_sold} />
        <StatTile label="Orders" value={data.orders_count} hint="Containing medicines" />
        <StatTile label="Average order" value={money(data.average_order_value)} />
        <StatTile label="Catalogue size" value={data.medicines_count} />
        <StatTile
          label="Needs restocking"
          value={needsAttention}
          hint={`Out of stock ${data.out_of_stock_count || 0}, low ${data.low_stock_count || 0}`}
        />
      </div>

      <p className="pr-section-hint" style={{ marginBottom: 24 }}>
        {data.scope_note}
      </p>

      <div className="pr-grid pr-grid-wide" style={{ marginBottom: 28 }}>
        <div className="pr-card">
          <h3 className="pr-section-title">Revenue by category</h3>
          <p className="pr-section-hint">Counted against each medicine's first category.</p>
          <DonutChart data={data.category_mix} valuePrefix="$" centerLabel="Medicine revenue" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">Best sellers by revenue</h3>
          <ShareBars data={data.top_medicines} valuePrefix="$" emptyMessage="Nothing sold yet" />
        </div>
      </div>

      <Section title="Monthly medicine revenue" hint="Last six months.">
        <div className="pr-card">
          <TrendBars data={data.monthly_revenue} valuePrefix="$" />
        </div>
      </Section>

      <div className="pr-grid pr-grid-wide" style={{ marginBottom: 28 }}>
        <div className="pr-card">
          <h3 className="pr-section-title">Best sellers by units</h3>
          <ShareBars data={data.top_by_units} emptyMessage="Nothing sold yet" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">First orders against renewals</h3>
          <p className="pr-section-hint">How much of the revenue is repeat business.</p>
          <ShareBars data={data.repeat_mix} valuePrefix="$" emptyMessage="No orders yet" />
        </div>
      </div>

      <Section
        title="Stock needing attention"
        hint={`Out of stock, then anything at or below ${data.low_stock_threshold} units.`}
      >
        {(data.out_of_stock?.length || 0) + (data.low_stock?.length || 0) === 0 ? (
          <EmptyState>Every medicine is comfortably in stock.</EmptyState>
        ) : (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Generic</th>
                  <th>Brand</th>
                  <th>Stock</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {[...(data.out_of_stock || []), ...(data.low_stock || [])].map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.generic_name || "N/A"}</td>
                    <td>{row.brand || "N/A"}</td>
                    <td>{row.stock}</td>
                    <td>{row.stock <= 0 ? "Out of stock" : "Running low"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Recent sales" hint="The last ten medicine lines sold.">
        {data.recent_sales?.length ? (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Line total</th>
                  <th>Placed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sales.map((sale, index) => (
                  <tr key={`${sale.order_id}-${sale.medicine}-${index}`}>
                    <td>#{sale.order_id}</td>
                    <td>{sale.medicine}</td>
                    <td>{sale.quantity}</td>
                    <td>{money(sale.line_total)}</td>
                    <td>{sale.order_date ? new Date(sale.order_date).toLocaleDateString() : "N/A"}</td>
                    <td>{sale.order_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No medicine has been sold yet.</EmptyState>
        )}
      </Section>
    </>
  )
}

function CustomerView({ data }) {
  return (
    <>
      {data.is_premium && (
        <ProfileBanner
          title="Premium member"
          subtitle="You save 10% on medicines and equipment whenever you pay by card."
          meta={{
            label: "Access until",
            value: data.premium_expires_at
              ? new Date(data.premium_expires_at).toLocaleDateString()
              : "N/A",
          }}
        />
      )}

      <div className="pr-stats">
        <StatTile label="Total spend" value={money(data.total_spend)} hint="Excludes cancelled" />
        <StatTile label="Orders" value={data.orders_count} />
        <StatTile label="Delivery charges" value={money(data.delivery_spend)} />
        <StatTile
          label="Premium saved"
          value={money(data.premium_savings)}
          hint="From card discounts"
        />
        <StatTile
          label="Subscription saved"
          value={money(data.subscription_savings)}
          hint="From renewals"
        />
        <StatTile label="Active rentals" value={data.active_rentals} />
      </div>

      <div className="pr-grid pr-grid-wide" style={{ marginBottom: 28 }}>
        <div className="pr-card">
          <h3 className="pr-section-title">Where your money goes</h3>
          <p className="pr-section-hint">Medicines against equipment.</p>
          <DonutChart data={data.spend_mix} valuePrefix="$" centerLabel="Total spend" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">Spend split</h3>
          <p className="pr-section-hint">The same figures as shares.</p>
          <ShareBars data={data.spend_mix} valuePrefix="$" emptyMessage="No orders yet" />
        </div>
      </div>

      <Section title="Monthly spend" hint="Last six months.">
        <div className="pr-card">
          <TrendBars data={data.monthly_spend} valuePrefix="$" />
        </div>
      </Section>

      <div className="pr-grid pr-grid-wide">
        <div className="pr-card">
          <h3 className="pr-section-title">Equipment categories</h3>
          <ShareBars data={data.category_mix} valuePrefix="$" emptyMessage="No equipment ordered yet" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">Most purchased</h3>
          <ShareBars data={data.top_items} valuePrefix="$" emptyMessage="No orders yet" />
        </div>
      </div>
    </>
  )
}

function VolunteerView({ data }) {
  const attended = data.incidents_helped || 0
  const missed = Math.max(0, (data.alerts_received || 0) - attended)

  const responseMix = [
    { label: "Attended", value: attended, percentage: data.response_rate },
    {
      label: "Not attended",
      value: missed,
      percentage: Number((100 - (data.response_rate || 0)).toFixed(1)),
    },
  ]

  return (
    <>
      <div className="pr-stats">
        <StatTile label="Incidents helped" value={data.incidents_helped} />
        <StatTile label="Alerts received" value={data.alerts_received} />
        <StatTile label="Response rate" value={`${data.response_rate}%`} />
        <StatTile
          label="Points"
          value={data.points}
          hint={`${data.lifetime_points} lifetime`}
        />
      </div>

      <div className="pr-grid pr-grid-wide" style={{ marginBottom: 28 }}>
        <div className="pr-card">
          <h3 className="pr-section-title">Alert response</h3>
          <p className="pr-section-hint">How often an alert became an attendance.</p>
          <DonutChart data={responseMix} centerLabel="Alerts" />
        </div>
        <div className="pr-card">
          <h3 className="pr-section-title">Contribution</h3>
          <p className="pr-section-hint">
            Average {data.average_distance_km} km from the incidents you were called to.
          </p>
          <ShareBars data={responseMix} emptyMessage="No alerts received yet" />
        </div>
      </div>

      <Section title="Top volunteers">
        {!data.leaderboard || data.leaderboard.length === 0 ? (
          <EmptyState>No volunteer activity recorded yet.</EmptyState>
        ) : (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Volunteer</th>
                  <th>Incidents</th>
                  <th>Lifetime points</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((row) => (
                  <tr key={row.rank} style={row.is_you ? { background: "#eef6fd", fontWeight: 600 } : undefined}>
                    <td>{row.rank}</td>
                    <td>{row.name}{row.is_you ? " (you)" : ""}</td>
                    <td>{row.incidents}</td>
                    <td>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}
