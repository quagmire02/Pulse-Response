"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  getVolunteerProfileAction,
  getVolunteerStatsAction,
  updateVolunteerLocationAction,
  setVolunteerAvailabilityAction,
  respondToVolunteerAlertAction,
  redeemVolunteerRewardAction,
  applyVolunteerRewardAction,
} from "@/actions/volunteerActions"
import { StatTile } from "@/components/charts/Charts"
import LiveMap from "@/components/map/LiveMap"
import styles from "./page.module.css"

const PING_INTERVAL_MS = 20000
const REFRESH_INTERVAL_MS = 25000

export default function VolunteerPage() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [rewards, setRewards] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState("")

  const [onDuty, setOnDuty] = useState(false)
  const [position, setPosition] = useState(null)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const latestPosition = useRef(null)

  useEffect(() => {
    load()
    return () => stopTracking()
  }, [])

  // Keep the incident list fresh while on duty so a new alert appears without
  // the volunteer refreshing.
  useEffect(() => {
    if (!onDuty) return
    const poll = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(poll)
  }, [onDuty])

  const load = async () => {
    const [profileResult, statsResult] = await Promise.all([
      getVolunteerProfileAction(),
      getVolunteerStatsAction(),
    ])

    if (profileResult.error) {
      setError(
        typeof profileResult.error === "string"
          ? profileResult.error
          : "Failed to load your volunteer profile."
      )
      setLoading(false)
      return
    }

    setProfile(profileResult.data.volunteer)
    setAlerts(profileResult.data.alerts || [])
    setRewards(profileResult.data.rewards || [])

    // Duty is held server side, so a refresh keeps the volunteer on duty. The
    // watcher has to be restarted too, otherwise the badge would say on duty
    // while the position quietly went stale and the scan skipped them.
    const stillOnDuty = Boolean(profileResult.data.volunteer?.is_available)
    setOnDuty(stillOnDuty)

    if (stillOnDuty && watchIdRef.current === null) {
      startTracking()
    }

    if (!statsResult.error) setStats(statsResult.data)

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
        latestPosition.current = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        setPosition(latestPosition.current)
        setError("")
      },
      (err) => setError(`Location error: ${err.message}. Allow location access to go on duty.`),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
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
    await updateVolunteerLocationAction(coords.latitude, coords.longitude)
  }

  const toggleDuty = async () => {
    const going = !onDuty
    const result = await setVolunteerAvailabilityAction(going)

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to change availability.")
      return
    }

    setOnDuty(going)
    setMessage(going ? "You are on duty. Nearby emergencies will reach you." : "You are off duty.")

    if (going) {
      startTracking()
    } else {
      stopTracking()
      setPosition(null)
    }

    load()
  }

  const run = async (key, action) => {
    setBusy(key)
    setError("")
    setMessage("")

    const result = await action()
    setBusy("")

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setMessage(result.success)
    }

    load()
  }

  const applyAppearance = async (type, value) => {
    const result = await applyVolunteerRewardAction(type, value)

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to apply.")
      return
    }

    setMessage(result.success)
    // Tell the layout to repaint without a reload.
    window.dispatchEvent(new Event("appearance-changed"))
    load()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your volunteer console</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error || "You do not have a volunteer profile."}</p>
          <button className={styles.secondaryBtn} onClick={() => router.push("/")}>
            Return home
          </button>
        </div>
      </div>
    )
  }

  const themes = rewards.filter((reward) => reward.type === "theme")
  const fonts = rewards.filter((reward) => reward.type === "font")

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Volunteer Console</h1>
          <p className={styles.subtitle}>
            Emergencies within 2.5 km of you are sent here so you can start first aid
            before the ambulance arrives.
          </p>
        </div>
        <span className={`${styles.dutyBadge} ${onDuty ? styles.online : styles.offline}`}>
          {onDuty ? "On duty" : "Off duty"}
        </span>
      </div>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        <StatTile label="Points balance" value={profile.points} hint="Spend on appearance perks" />
        <StatTile label="Incidents helped" value={profile.incidents_helped} />
        <StatTile label="Lifetime points" value={profile.lifetime_points} />
        {stats && (
          <StatTile
            label="Response rate"
            value={`${stats.response_rate}%`}
            hint={`${stats.alerts_received} alert(s) received`}
          />
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Availability</h2>
        <p className={styles.hint}>
          Your device reports its position while you are on duty. Going off duty removes you
          from the alert scan straight away.
        </p>
        <div className={styles.statusRow}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Average distance to incidents</span>
            <span className={styles.statusValue}>
              {stats ? `${stats.average_distance_km} km` : "N/A"}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Alerts received</span>
            <span className={styles.statusValue}>{stats ? stats.alerts_received : "N/A"}</span>
          </div>
        </div>

        <LiveMap
          latitude={position?.latitude ?? profile.current_lat}
          longitude={position?.longitude ?? profile.current_lng}
          label="Your position"
          height={230}
        />

        <button
          className={onDuty ? styles.dangerBtn : styles.primaryBtn}
          onClick={toggleDuty}
          style={{ marginTop: "16px" }}
        >
          {onDuty ? "Go off duty" : "Go on duty"}
        </button>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Nearby emergencies</h2>

        {alerts.length === 0 ? (
          <p className={styles.hint}>
            Nothing yet. {onDuty ? "You will be alerted if something happens close by." : "Go on duty to receive alerts."}
          </p>
        ) : (
          <div className={styles.alertList}>
            {alerts.map((alert) => {
              const incident = alert.emergency_alert
              const ongoing = alert.status === "notified" || alert.status === "responded"

              return (
                <div key={alert.id} className={styles.alertCard}>
                  <div className={styles.alertHeader}>
                    <div>
                      <h3 className={styles.alertType}>
                        {String(incident?.alert_type || "Emergency").replace(/_/g, " ")}
                      </h3>
                      <span className={styles.alertMeta}>
                        {incident?.location} &middot; {alert.distance_km} km away
                      </span>
                    </div>
                    <span className={`${styles.statusChip} ${ongoing ? styles.ongoing : styles.resolved}`}>
                      {alert.status === "cancelled"
                        ? "Cancelled"
                        : ongoing
                        ? "Ongoing"
                        : "Resolved"}
                    </span>
                  </div>

                  <div className={styles.alertDetails}>
                    <span>
                      Ambulance:{" "}
                      {incident?.assigned_vehicle?.vehicle_number || "not assigned yet"}
                    </span>
                    <span>Reported {new Date(alert.created_at).toLocaleString()}</span>
                    {alert.points_awarded > 0 && (
                      <span className={styles.pointsEarned}>+{alert.points_awarded} points</span>
                    )}
                  </div>

                  {/* Where the incident actually is, with a readable address. */}
                  {incident?.latitude && incident?.longitude && (
                    <LiveMap
                      latitude={incident.latitude}
                      longitude={incident.longitude}
                      fromLat={position?.latitude}
                      fromLng={position?.longitude}
                      label="Incident location"
                      height={200}
                    />
                  )}

                  <div className={styles.alertActions}>
                    {alert.status === "notified" && (
                      <button
                        className={styles.primaryBtn}
                        onClick={() => run(`respond-${alert.id}`, () => respondToVolunteerAlertAction(alert.id))}
                        disabled={busy !== ""}
                      >
                        {busy === `respond-${alert.id}` ? "Saving..." : "I helped at this incident"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Rewards store</h2>
        <p className={styles.hint}>
          You earn points for every incident you attend. Spend them on how the site looks.
        </p>

        <div className={styles.rewardGrid}>
          {rewards.map((reward) => (
            <div key={reward.key} className={styles.reward}>
              <div className={styles.rewardInfo}>
                <span className={styles.rewardName}>{reward.name}</span>
                <span className={styles.rewardCost}>{reward.cost} points</span>
              </div>
              {reward.unlocked ? (
                <span className={styles.ownedChip}>Owned</span>
              ) : (
                <button
                  className={styles.primaryBtn}
                  onClick={() => run(`redeem-${reward.key}`, () => redeemVolunteerRewardAction(reward.key))}
                  disabled={busy !== "" || !reward.affordable}
                  title={reward.affordable ? "" : "Not enough points yet"}
                >
                  {busy === `redeem-${reward.key}` ? "..." : "Unlock"}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.appearanceRow}>
          <div className={styles.appearanceGroup}>
            <span className={styles.statusLabel}>Theme</span>
            <div className={styles.chipRow}>
              <button
                className={`${styles.chip} ${profile.active_theme === "default" ? styles.chipActive : ""}`}
                onClick={() => applyAppearance("theme", "default")}
              >
                Default
              </button>
              {themes.filter((t) => t.unlocked).map((theme) => (
                <button
                  key={theme.key}
                  className={`${styles.chip} ${profile.active_theme === theme.value ? styles.chipActive : ""}`}
                  onClick={() => applyAppearance("theme", theme.value)}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.appearanceGroup}>
            <span className={styles.statusLabel}>Typeface</span>
            <div className={styles.chipRow}>
              <button
                className={`${styles.chip} ${profile.active_font === "default" ? styles.chipActive : ""}`}
                onClick={() => applyAppearance("font", "default")}
              >
                Default
              </button>
              {fonts.filter((f) => f.unlocked).map((font) => (
                <button
                  key={font.key}
                  className={`${styles.chip} ${profile.active_font === font.value ? styles.chipActive : ""}`}
                  onClick={() => applyAppearance("font", font.value)}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {stats?.leaderboard?.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top volunteers</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Volunteer</th>
                  <th>Incidents</th>
                  <th>Lifetime points</th>
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard.map((row) => (
                  <tr key={row.rank} className={row.is_you ? styles.youRow : ""}>
                    <td>{row.rank}</td>
                    <td>{row.name}{row.is_you ? " (you)" : ""}</td>
                    <td>{row.incidents}</td>
                    <td>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
