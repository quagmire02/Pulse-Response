"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getAmbulanceFleetAction,
  getAmbulanceCompaniesAction,
  createAmbulanceVehicleAction,
  updateAmbulanceVehicleAction,
  deleteAmbulanceVehicleAction,
} from "@/actions/ambulanceActions"
import styles from "./page.module.css"

const emptyForm = { vehicle_number: "", model: "", ambulance_company_id: "" }

export default function AdminAmbulancesPage() {
  const router = useRouter()

  const [fleet, setFleet] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busyId, setBusyId] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [])

  // Refresh positions periodically so the page reflects drivers going on and
  // off duty without a manual reload.
  useEffect(() => {
    const poll = setInterval(load, 30000)
    return () => clearInterval(poll)
  }, [])

  const load = async () => {
    const [fleetResult, companyResult] = await Promise.all([
      getAmbulanceFleetAction(),
      getAmbulanceCompaniesAction(),
    ])

    if (fleetResult.error) {
      setError(typeof fleetResult.error === "string" ? fleetResult.error : "Failed to load the fleet.")
    } else {
      setFleet(fleetResult.data || [])
      setError("")
    }

    if (!companyResult.error) {
      setCompanies(companyResult.data || [])
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    setMessage("")

    const result = await createAmbulanceVehicleAction(form)
    setCreating(false)

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      return
    }

    setMessage(result.success || "Ambulance added.")
    setForm(emptyForm)
    load()
  }

  const handleUnassign = async (vehicleId) => {
    setBusyId(vehicleId)
    setError("")
    setMessage("")

    const result = await updateAmbulanceVehicleAction(vehicleId, { driver_user_id: null })
    setBusyId(null)

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      return
    }

    setMessage("Driver unassigned.")
    load()
  }

  const handleDelete = async (vehicleId) => {
    setBusyId(vehicleId)
    setError("")
    setMessage("")

    const result = await deleteAmbulanceVehicleAction(vehicleId)
    setBusyId(null)

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      return
    }

    setMessage("Ambulance removed.")
    load()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Ambulance Fleet</h1>
      </div>

      <p className={styles.subtitle}>
        Register ambulances here, then assign a driver to one when you approve their
        signup request. Dispatch only considers vehicles whose driver is on duty and
        has reported a position in the last two minutes.
      </p>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.createForm} onSubmit={handleCreate}>
        <h2 className={styles.sectionTitle}>Add an ambulance</h2>
        <div className={styles.formRow}>
          <label className={styles.label}>
            Vehicle number
            <input
              className={styles.input}
              name="vehicle_number"
              value={form.vehicle_number}
              onChange={handleChange}
              placeholder="AMB-101"
              required
              disabled={creating}
            />
          </label>

          <label className={styles.label}>
            Model
            <input
              className={styles.input}
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="Toyota HiAce"
              required
              disabled={creating}
            />
          </label>

          <label className={styles.label}>
            Company
            <select
              className={styles.input}
              name="ambulance_company_id"
              value={form.ambulance_company_id}
              onChange={handleChange}
              required
              disabled={creating || companies.length === 0}
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {companies.length === 0 && (
          <p className={styles.hint}>
            No ambulance companies yet. Approve an Ambulance Company signup request first.
          </p>
        )}

        <button type="submit" className={styles.primaryBtn} disabled={creating || companies.length === 0}>
          {creating ? "Adding..." : "Add ambulance"}
        </button>
      </form>

      <h2 className={styles.sectionTitle}>Live fleet</h2>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : fleet.length === 0 ? (
        <div className={styles.noData}>No ambulances registered yet.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Model</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Position</th>
                <th>Last ping</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.vehicle_number}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.driver || <span className={styles.muted}>Unassigned</span>}</td>
                  <td>
                    <span className={`${styles.badge} ${vehicle.is_online ? styles.online : styles.offline}`}>
                      {vehicle.is_online ? "Online" : "Offline"}
                    </span>
                    <span className={styles.subStatus}>{vehicle.status}</span>
                  </td>
                  <td>
                    {vehicle.latitude && vehicle.longitude ? (
                      <a
                        className={styles.mapLink}
                        href={`https://www.openstreetmap.org/?mlat=${vehicle.latitude}&mlon=${vehicle.longitude}#map=15/${vehicle.latitude}/${vehicle.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {Number(vehicle.latitude).toFixed(4)}, {Number(vehicle.longitude).toFixed(4)}
                      </a>
                    ) : (
                      <span className={styles.muted}>No position</span>
                    )}
                  </td>
                  <td>
                    {vehicle.last_ping_at
                      ? new Date(vehicle.last_ping_at).toLocaleTimeString()
                      : <span className={styles.muted}>Never</span>}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {vehicle.driver && (
                        <button
                          className={styles.secondaryBtn}
                          onClick={() => handleUnassign(vehicle.id)}
                          disabled={busyId === vehicle.id}
                        >
                          Unassign
                        </button>
                      )}
                      <button
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={busyId === vehicle.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
