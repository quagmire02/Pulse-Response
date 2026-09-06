"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  getMyAmbulanceAction,
  updateAmbulanceLocationAction,
  setAmbulanceStatusAction,
  completeAmbulanceAssignmentAction,
} from "@/actions/ambulanceActions"
import LiveMap from "@/components/map/LiveMap"
import styles from "./page.module.css"

const PING_INTERVAL_MS = 15000

export default function DriverPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [vehicle, setVehicle] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [onDuty, setOnDuty] = useState(false)
  const [position, setPosition] = useState(null)
  const [lastPing, setLastPing] = useState(null)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const latestPosition = useRef(null)

  useEffect(() => {
    loadVehicle()
    return () => stopTracking()
  }, [])

  useEffect(() => {
    if (!onDuty) return
    const poll = setInterval(loadVehicle, 20000)
    return () => clearInterval(poll)
  }, [onDuty])

  const loadVehicle = async () => {
    const result = await getMyAmbulanceAction()

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to load your ambulance.")
      setLoading(false)
      return
    }

    setVehicle(result.data.vehicle)
    setAssignment(result.data.assignment)

    const stillOnDuty = result.data.vehicle?.status !== "maintenance"
    setOnDuty(stillOnDuty)

    if (stillOnDuty && watchIdRef.current === null) {
      startTracking()
    }

    if (result.data.vehicle?.last_ping_at) {
      setLastPing(new Date(result.data.vehicle.last_ping_at))
    }
    setError("")
    setLoading(false)
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("This browser does not support location access.")
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        latestPosition.current = coords
        setPosition(coords)
        setError("")
      },
      (err) => {
        setError(`Location error: ${err.message}. Allow location access to go on duty.`)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    )

    timerRef.current = setInterval(sendPing, PING_INTERVAL_MS)
    sendPing()
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const sendPing = async () => {
    const coords = latestPosition.current
    if (!coords) return

    const result = await updateAmbulanceLocationAction(coords.latitude, coords.longitude)
    if (!result.error) {
      setLastPing(new Date())
    }
  }

  const handleDutyToggle = async () => {
    const goingOnDuty = !onDuty

    const result = await setAmbulanceStatusAction(goingOnDuty ? "available" : "maintenance")
    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to change duty status.")
      return
    }

    setOnDuty(goingOnDuty)
    setMessage(goingOnDuty ? "You are on duty and visible to dispatch." : "You are off duty.")

    if (goingOnDuty) {
      startTracking()
    } else {
      stopTracking()
      setPosition(null)
      setLastPing(null)
    }

    loadVehicle()
  }

  const handleComplete = async () => {
    if (!assignment) return

    const result = await completeAmbulanceAssignmentAction(assignment.id)
    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to complete the assignment.")
      return
    }

    setMessage("Assignment completed.")
    setAssignment(null)
    loadVehicle()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your vehicle</div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error || "You are not assigned to any ambulance."}</p>
          <button className={styles.secondaryBtn} onClick={() => router.push("/")}>
            Return home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Driver Console</h1>
          <p className={styles.subtitle}>
            {vehicle.vehicle_number} &middot; {vehicle.model}
            {vehicle.company?.company_name ? ` · ${vehicle.company.company_name}` : ""}
          </p>
        </div>
        <span className={`${styles.dutyBadge} ${onDuty ? styles.online : styles.offline}`}>
          {onDuty ? "On duty" : "Off duty"}
        </span>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Location sharing</h2>
        <p className={styles.hint}>
          Your device reports its position every {PING_INTERVAL_MS / 1000} seconds while on duty.
          Dispatch only considers vehicles that have reported within the last two minutes.
        </p>

        <div className={styles.statusRow}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Last reported</span>
            <span className={styles.statusValue}>
              {lastPing ? lastPing.toLocaleTimeString() : "Never"}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Vehicle status</span>
            <span className={styles.statusValue}>{vehicle.status}</span>
          </div>
        </div>

        <LiveMap
          latitude={position?.latitude ?? vehicle.current_lat}
          longitude={position?.longitude ?? vehicle.current_lng}
          label="Your position"
          height={240}
        />

        <button
          className={onDuty ? styles.dangerBtn : styles.primaryBtn}
          onClick={handleDutyToggle}
        >
          {onDuty ? "Go off duty" : "Go on duty"}
        </button>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Current assignment</h2>

        {assignment ? (
          <>
            <div className={styles.statusRow}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Destination</span>
                <span className={styles.statusValue}>{assignment.location}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Type</span>
                <span className={styles.statusValue}>
                  {String(assignment.alert_type).replace(/_/g, " ")}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Distance</span>
                <span className={styles.statusValue}>
                  {assignment.assigned_distance_km ? `${assignment.assigned_distance_km} km` : "N/A"}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Estimated arrival</span>
                <span className={styles.statusValue}>
                  {assignment.assigned_eta_minutes ? `${assignment.assigned_eta_minutes} min` : "N/A"}
                </span>
              </div>
            </div>

            {assignment.notes && <p className={styles.notes}>Notes: {assignment.notes}</p>}

            <LiveMap
              latitude={assignment.latitude}
              longitude={assignment.longitude}
              fromLat={position?.latitude}
              fromLng={position?.longitude}
              label="Emergency location"
              height={260}
            />

            <button className={styles.primaryBtn} onClick={handleComplete}>
              Mark as completed
            </button>
          </>
        ) : (
          <p className={styles.hint}>
            No active assignment. {onDuty ? "You will be notified when dispatch assigns one." : "Go on duty to receive calls."}
          </p>
        )}
      </div>
    </div>
  )
}
