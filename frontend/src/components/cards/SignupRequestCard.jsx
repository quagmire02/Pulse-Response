"use client"

import { useState } from "react"
import { roleLabel } from "@/libs/roles"
import styles from "./SignupRequestCard.module.css"

export default function SignupRequestCard({
  request,
  busy,
  vehicles = [],
  onApprove,
  onReject,
  onDelete,
}) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState("")
  const [vehicleId, setVehicleId] = useState("")

  const fullName = `${request.first_name || ""} ${request.last_name || ""}`.trim() || request.username
  const isPending = request.status === "pending"

  const needsVehicle = request.role === "driver"

  const handleReject = () => {
    onReject(reason)
    setShowRejectForm(false)
    setReason("")
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{roleLabel(request.role).charAt(0)}</span>
        </div>
        <div className={styles.titleInfo}>
          <h3 className={styles.name}>{fullName}</h3>
          <span className={styles.role}>{roleLabel(request.role)}</span>
        </div>
        <span className={`${styles.status} ${styles[request.status]}`}>{request.status}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <strong>Email:</strong> {request.email}
          </div>
          <div className={styles.detailItem}>
            <strong>Username:</strong> {request.username}
          </div>
          {request.address && (
            <div className={styles.detailItem}>
              <strong>Address:</strong> {request.address}
            </div>
          )}
          {request.license_num && (
            <div className={styles.detailItem}>
              <strong>License:</strong> {request.license_num}
            </div>
          )}
          {request.speciality && (
            <div className={styles.detailItem}>
              <strong>Speciality:</strong> {request.speciality}
            </div>
          )}
          {request.company_name && (
            <div className={styles.detailItem}>
              <strong>Company:</strong> {request.company_name}
            </div>
          )}
          {request.contact_phone && (
            <div className={styles.detailItem}>
              <strong>Phone:</strong> {request.contact_phone}
            </div>
          )}
        </div>

        {request.bio && <p className={styles.description}>{request.bio}</p>}
        {request.description && <p className={styles.description}>{request.description}</p>}

        {request.rejection_reason && (
          <p className={styles.rejectionReason}>
            <strong>Rejection reason:</strong> {request.rejection_reason}
          </p>
        )}
      </div>

      {isPending ? (
        showRejectForm ? (
          <div className={styles.rejectForm}>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={() => setShowRejectForm(false)} disabled={busy}>
                Cancel
              </button>
              <button className={styles.rejectBtn} onClick={handleReject} disabled={busy}>
                {busy ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {needsVehicle && (
              <div className={styles.assignBlock}>
                <label className={styles.assignLabel} htmlFor={`vehicle-${request.id}`}>
                  Assign to ambulance
                </label>
                <select
                  id={`vehicle-${request.id}`}
                  className={styles.select}
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={busy || vehicles.length === 0}
                >
                  <option value="">Select an ambulance</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} — {vehicle.model}
                      {vehicle.company?.company_name ? ` (${vehicle.company.company_name})` : ""}
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && (
                  <span className={styles.assignHint}>
                    No free ambulances. Add one under Ambulance Fleet first.
                  </span>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.rejectBtn} onClick={() => setShowRejectForm(true)} disabled={busy}>
                Reject
              </button>
              <button
                className={styles.approveBtn}
                onClick={() => onApprove(needsVehicle ? vehicleId : null)}
                disabled={busy || (needsVehicle && !vehicleId)}
              >
                {busy ? "Approving..." : "Approve"}
              </button>
            </div>
          </>
        )
      ) : (
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onDelete} disabled={busy}>
            {busy ? "Removing..." : "Remove from queue"}
          </button>
        </div>
      )}
    </div>
  )
}
