"use client"

import { useState } from "react"
import { updateEquipmentFulfillmentAction } from "@/actions/fulfillmentActions"
import styles from "./FulfillmentQueue.module.css"

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirm request" },
  { value: "scheduled", label: "Schedule handover" },
  { value: "handed_over", label: "Mark handed over" },
  { value: "returned", label: "Mark returned" },
  { value: "cancelled", label: "Cancel request" },
]

export default function FulfillmentQueue({ requests = [], onUpdated }) {
  const [openId, setOpenId] = useState(null)
  const [status, setStatus] = useState("confirmed")
  const [scheduledAt, setScheduledAt] = useState("")
  const [note, setNote] = useState("")
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")

  const startEditing = (request) => {
    setOpenId(request.id)
    setStatus(request.status === "pending" ? "confirmed" : request.status)
    setScheduledAt(
      request.handover_scheduled_at
        ? new Date(request.handover_scheduled_at).toISOString().slice(0, 16)
        : ""
    )
    setNote(request.vendor_note || "")
    setError("")
  }

  const submit = async (id) => {
    setBusyId(id)
    setError("")

    const payload = { status }
    if (scheduledAt) payload.handover_scheduled_at = new Date(scheduledAt).toISOString()
    if (note) payload.vendor_note = note

    const result = await updateEquipmentFulfillmentAction(id, payload)
    setBusyId(null)

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      return
    }

    setOpenId(null)
    if (onUpdated) onUpdated()
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Handover Requests</h3>
      <p className={styles.sectionHint}>
        Customers state where they want to collect or receive equipment. Confirm a time and
        place here and they are notified straight away.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      {requests.length === 0 ? (
        <p className={styles.noData}>No open handover requests.</p>
      ) : (
        <div className={styles.list}>
          {requests.map((request) => (
            <div key={request.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4 className={styles.name}>{request.equipment_name}</h4>
                  <span className={styles.meta}>
                    Order {request.order_id} &middot; {request.type === "rental" ? "Rental" : "Purchase"} &middot;
                    Qty {request.quantity}
                  </span>
                </div>
                <span className={`${styles.status} ${styles[request.status] || ""}`}>{request.status}</span>
              </div>

              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <strong>Customer</strong>
                  <span>{request.customer_name}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Phone</strong>
                  <span>{request.customer_phone || "Not provided"}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Handover address</strong>
                  <span>{request.handover_address || "Not provided"}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Value</strong>
                  <span>${Number(request.total_price).toFixed(2)}</span>
                </div>
                {request.type === "rental" && (
                  <div className={styles.detailItem}>
                    <strong>Rental period</strong>
                    <span>{request.rental_start} to {request.rental_end}</span>
                  </div>
                )}
                {request.handover_scheduled_at && (
                  <div className={styles.detailItem}>
                    <strong>Scheduled</strong>
                    <span>{new Date(request.handover_scheduled_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {request.customer_note && (
                <p className={styles.note}>
                  <strong>Customer note:</strong> {request.customer_note}
                </p>
              )}
              {request.vendor_note && (
                <p className={styles.note}>
                  <strong>Your note:</strong> {request.vendor_note}
                </p>
              )}

              {openId === request.id ? (
                <div className={styles.form}>
                  <div className={styles.formRow}>
                    <label className={styles.label}>
                      Status
                      <select
                        className={styles.select}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={busyId === request.id}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.label}>
                      Handover time
                      <input
                        type="datetime-local"
                        className={styles.input}
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        disabled={busyId === request.id}
                      />
                    </label>
                  </div>

                  <label className={styles.label}>
                    Note to customer
                    <textarea
                      className={styles.textarea}
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Meet at the main pharmacy entrance, ask for the duty technician."
                      disabled={busyId === request.id}
                    />
                  </label>

                  <div className={styles.actions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setOpenId(null)}
                      disabled={busyId === request.id}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.submitBtn}
                      onClick={() => submit(request.id)}
                      disabled={busyId === request.id}
                    >
                      {busyId === request.id ? "Saving" : "Save and notify"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <button className={styles.submitBtn} onClick={() => startEditing(request)}>
                    Respond
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
