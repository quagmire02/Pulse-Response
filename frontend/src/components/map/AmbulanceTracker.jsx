"use client"

import { useState, useEffect, useRef } from "react"
import { getEmergencyTrackingAction } from "@/actions/ledgerActions"
import LiveMap from "@/components/map/LiveMap"
import styles from "./AmbulanceTracker.module.css"

const ACTIVE_POLL_MS = 10000

const IDLE_POLL_MS = 60000

const STALE_AFTER_MS = 120000

export default function AmbulanceTracker({ alertId = null }) {
  const [tracking, setTracking] = useState(null)
  const [error, setError] = useState("")
  const [checked, setChecked] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const result = await getEmergencyTrackingAction(alertId)
      if (cancelled) return

      let live = false

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Could not load tracking.")
      } else {
        setTracking(result.data || null)
        setError("")
        live = Boolean(result.data?.alert)
      }

      setChecked(true)
      timerRef.current = setTimeout(poll, live ? ACTIVE_POLL_MS : IDLE_POLL_MS)
    }

    poll()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [alertId])

  if (!checked || !tracking?.alert) {
    return null
  }

  const { alert, ambulance, volunteers } = tracking

  const lastPing = ambulance?.last_ping_at ? new Date(ambulance.last_ping_at) : null
  const isFresh = lastPing && Date.now() - lastPing.getTime() < STALE_AFTER_MS

  const routeHref =
    ambulance?.latitude && ambulance?.longitude && alert.latitude && alert.longitude
      ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${ambulance.latitude},${ambulance.longitude};${alert.latitude},${alert.longitude}`
      : null

  return (
    <section className={styles.panel}>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Emergency in progress</span>
          <h2 className={styles.title}>
            {String(alert.alert_type || "Emergency").replace(/_/g, " ")}
          </h2>
          <p className={styles.location}>{alert.location}</p>
        </div>
        <span className={`${styles.statusChip} ${alert.status === "dispatched" ? styles.dispatched : styles.pending}`}>
          {alert.status === "dispatched" ? "Ambulance on the way" : "Awaiting a vehicle"}
        </span>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {ambulance ? (
        <>
          <div className={styles.factRow}>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Vehicle</span>
              <span className={styles.factValue}>{ambulance.vehicle_number}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Distance remaining</span>
              <span className={styles.factValue}>
                {ambulance.remaining_km !== null && ambulance.remaining_km !== undefined
                  ? `${ambulance.remaining_km} km`
                  : "Calculating"}
              </span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Estimated arrival</span>
              <span className={styles.factValue}>
                {alert.eta_minutes ? `${alert.eta_minutes} min` : "Calculating"}
              </span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Position updated</span>
              <span className={`${styles.factValue} ${isFresh ? styles.live : styles.stale}`}>
                {lastPing ? (isFresh ? "Live now" : lastPing.toLocaleTimeString()) : "Not reporting"}
              </span>
            </div>
          </div>

          <LiveMap
            latitude={ambulance.latitude}
            longitude={ambulance.longitude}
            label={`Ambulance ${ambulance.vehicle_number} is here`}
            height={280}
          />

          <div className={styles.contactRow}>
            <div className={styles.contact}>
              <span className={styles.factLabel}>Driver</span>
              <span className={styles.factValue}>{ambulance.driver_name || "Being assigned"}</span>
            </div>
            <div className={styles.contact}>
              <span className={styles.factLabel}>Operator</span>
              <span className={styles.factValue}>{ambulance.company_name || "N/A"}</span>
            </div>
            {ambulance.contact_phone && (
              <div className={styles.contact}>
                <span className={styles.factLabel}>Dispatch desk</span>
                <a className={styles.phone} href={`tel:${ambulance.contact_phone}`}>
                  {ambulance.contact_phone}
                </a>
              </div>
            )}
            {routeHref && (
              <a className={styles.routeLink} href={routeHref} target="_blank" rel="noreferrer">
                Open the route to you
              </a>
            )}
          </div>

          {!isFresh && (
            <p className={styles.warning}>
              The vehicle has not reported its position recently. The marker shows where it
              was last seen.
            </p>
          )}
        </>
      ) : (
        <p className={styles.warning}>
          No ambulance has been assigned yet. Your alert has been logged and an operator
          will follow up.
        </p>
      )}

      {volunteers?.length > 0 && (
        <div className={styles.volunteers}>
          <span className={styles.factLabel}>Volunteers with you</span>
          <ul className={styles.volunteerList}>
            {volunteers.map((volunteer, index) => (
              <li key={`${volunteer.name}-${index}`}>
                <strong>{volunteer.name}</strong>
                {volunteer.skills ? ` — ${volunteer.skills}` : ""}
                {volunteer.distance_km ? ` (${volunteer.distance_km} km away)` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
