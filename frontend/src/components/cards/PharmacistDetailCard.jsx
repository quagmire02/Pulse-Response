"use client"

import { useState, useEffect } from "react"
import UpdatePharmacistButton from "@/components/buttons/UpdatePharmacistButton"
import DeleteButton from "@/components/buttons/DeleteButton"
import UpdatePharmacistModal from "@/components/modals/UpdatePharmacistModal"
import DeleteModal from "@/components/modals/DeleteModal"
import { deleteUserAction } from "@/actions/userActions"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import {
  getSlotsAction,
  createConsultationAction,
  createSlotAction,
  deleteSlotAction,
  getReviewsAction,
  createReviewAction,
  deleteReviewAction,
} from "@/actions/consultationActions"
import styles from "./PharmacistDetailCard.module.css"

export default function PharmacistDetailCard({ pharmacist, onUpdateSuccess, onDeleteSuccess }) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)

  const [selectedDate, setSelectedDate] = useState("")
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingMsg, setBookingMsg] = useState("")
  const [bookingError, setBookingError] = useState("")

  const [newSlotDate, setNewSlotDate] = useState("")
  const [newSlotHour, setNewSlotHour] = useState("")
  const [slotCreateMsg, setSlotCreateMsg] = useState("")
  const [slotCreateError, setSlotCreateError] = useState("")
  const [manageDate, setManageDate] = useState("")
  const [manageSlots, setManageSlots] = useState([])
  const [manageSlotsLoading, setManageSlotsLoading] = useState(false)

  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewMsg, setReviewMsg] = useState("")
  const [reviewError, setReviewError] = useState("")

  const isOwnProfile = userId == pharmacist.user_id
  const isDoctor = isOwnProfile
  const canBook = pharmacist.is_consultation && !isOwnProfile

  useEffect(() => {
    const init = async () => {
      try {
        const [id, role] = await Promise.all([getUserIdAction(), getUserRoleAction()])
        setUserId(id)
        setUserRole(role)
      } catch {}
    }
    init()
    fetchReviews()
  }, [])

  const fetchSlots = async (date) => {
    if (!date) return
    setSlotsLoading(true)
    setBookingMsg("")
    setBookingError("")
    const result = await getSlotsAction(pharmacist.id, { date })
    setSlotsLoading(false)
    if (result.error) return
    setSlots(result.data)
  }

  const fetchManageSlots = async (date) => {
    if (!date) return
    setManageSlotsLoading(true)
    const result = await getSlotsAction(pharmacist.id, { date })
    setManageSlotsLoading(false)
    if (result.error) return
    setManageSlots(result.data)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
    fetchSlots(e.target.value)
  }

  const handleManageDateChange = (e) => {
    setManageDate(e.target.value)
    fetchManageSlots(e.target.value)
  }

  const handleBookSlot = async (slot) => {
    setBookingMsg("")
    setBookingError("")
    const result = await createConsultationAction({
      pharmacist_id: pharmacist.id,
      date: selectedDate,
      start_time: slot.start_time,
      start_period: slot.start_period,
    })
    if (result.error) {
      setBookingError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setBookingMsg("Consultation booked successfully!")
      fetchSlots(selectedDate)
    }
  }

  const handleCreateSlot = async () => {
    setSlotCreateMsg("")
    setSlotCreateError("")
    const result = await createSlotAction({ date: newSlotDate, start_time: newSlotHour })
    if (result.error) {
      setSlotCreateError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setSlotCreateMsg("Slot added!")
      const createdDate = newSlotDate
      setNewSlotDate("")
      setNewSlotHour("")
      setManageDate(createdDate)
      fetchManageSlots(createdDate)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    const result = await deleteSlotAction(slotId)
    if (!result.error) fetchManageSlots(manageDate)
  }

  const fetchReviews = async () => {
    const result = await getReviewsAction(pharmacist.id)
    if (!result.error) setReviews(result.data || [])
  }

  const handleSubmitReview = async () => {
    setReviewMsg("")
    setReviewError("")
    const result = await createReviewAction(pharmacist.id, { rating: reviewRating, comment: reviewComment })
    if (result.error) {
      setReviewError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
    } else {
      setReviewMsg("Review submitted!")
      setReviewRating("")
      setReviewComment("")
      fetchReviews()
    }
  }

  const handleDeleteReview = async () => {
    const result = await deleteReviewAction(pharmacist.id)
    if (!result.error) fetchReviews()
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError("")
    try {
      const result = await deleteUserAction(pharmacist.user_id)
      if (result.error) {
        setDeleteError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setShowDeleteModal(false)
        onDeleteSuccess()
      }
    } catch {
      setDeleteError("Failed to delete pharmacist")
    } finally {
      setDeleteLoading(false)
    }
  }

  const fullName = `${pharmacist.user.first_name || ""} ${pharmacist.user.last_name || ""}`.trim()

  const hours = Array.from({ length: 15 }, (_, i) => i + 9)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.name}>{fullName || pharmacist.user.username || "Unknown"}</h1>
        <div className={styles.actions}>
          {isOwnProfile && (
            <>
              <UpdatePharmacistButton onClick={() => setShowUpdateModal(true)} />
              <DeleteButton onClick={() => setShowDeleteModal(true)} />
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><strong>Email:</strong> {pharmacist.user.email}</div>
            <div className={styles.infoItem}><strong>Username:</strong> {pharmacist.user.username}</div>
            <div className={styles.infoItem}><strong>First Name:</strong> {pharmacist.user.first_name || "N/A"}</div>
            <div className={styles.infoItem}><strong>Last Name:</strong> {pharmacist.user.last_name || "N/A"}</div>
            <div className={styles.infoItem}><strong>Location:</strong> {pharmacist.user.address || "N/A"}</div>
            <div className={styles.infoItem}>
              <strong>Status:</strong>
              <span className={`${styles.status} ${pharmacist.user.is_active ? styles.active : styles.inactive}`}>
                {pharmacist.user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Professional Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>License Number:</strong>
              <span className={styles.licenseNumber}>{pharmacist.license_num}</span>
            </div>
            <div className={styles.infoItem}><strong>Speciality:</strong> {pharmacist.speciality}</div>
            <div className={styles.infoItem}>
              <strong>Consultation Available:</strong>
              <span className={`${styles.consultationBadge} ${pharmacist.is_consultation ? styles.available : styles.unavailable}`}>
                {pharmacist.is_consultation ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {pharmacist.bio && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Biography</h3>
            <p className={styles.bio}>{pharmacist.bio}</p>
          </div>
        )}

        {canBook && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Book a Consultation</h3>
            <div className={styles.slotPicker}>
              <label className={styles.slotLabel}>Select Date</label>
              <input
                type="date"
                className={styles.dateInput}
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={handleDateChange}
              />
            </div>

            {slotsLoading && <p className={styles.slotInfo}>Loading slots...</p>}

            {selectedDate && !slotsLoading && (
              <div className={styles.slotsGrid}>
                {slots.length === 0 ? (
                  <p className={styles.slotInfo}>No slots available for this date.</p>
                ) : (
                  slots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`${styles.slotBtn} ${slot.is_available ? styles.slotAvailable : styles.slotBooked}`}
                      disabled={!slot.is_available}
                      onClick={() => slot.is_available && handleBookSlot(slot)}
                    >
                      {slot.start_time}:00 {slot.start_period} – {slot.end_time}:00 {slot.end_period}
                      <span className={styles.slotStatus}>{slot.is_available ? "Available" : "Booked"}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {bookingMsg && <p className={styles.successMsg}>{bookingMsg}</p>}
            {bookingError && <p className={styles.errorMsg}>{bookingError}</p>}
          </div>
        )}

        {isOwnProfile && isDoctor && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Manage My Available Slots</h3>
            <div className={styles.slotForm}>
              <input
                type="date"
                className={styles.dateInput}
                value={newSlotDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setNewSlotDate(e.target.value)}
              />
              <select
                className={styles.hourSelect}
                value={newSlotHour}
                onChange={(e) => setNewSlotHour(e.target.value)}
              >
                <option value="">Select Hour</option>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}
                  </option>
                ))}
              </select>
              <button
                className={styles.addSlotBtn}
                onClick={handleCreateSlot}
                disabled={!newSlotDate || newSlotHour === ""}
              >
                Add Slot
              </button>
            </div>
            {slotCreateMsg && <p className={styles.successMsg}>{slotCreateMsg}</p>}
            {slotCreateError && <p className={styles.errorMsg}>{slotCreateError}</p>}

            <div className={styles.slotPicker} style={{ marginTop: "16px" }}>
              <label className={styles.slotLabel}>View slots for date:</label>
              <input
                type="date"
                className={styles.dateInput}
                value={manageDate}
                onChange={handleManageDateChange}
              />
            </div>
            {manageSlotsLoading && <p className={styles.slotInfo}>Loading slots...</p>}
            {manageDate && !manageSlotsLoading && (
              <div className={styles.slotsGrid}>
                {manageSlots.length === 0 ? (
                  <p className={styles.slotInfo}>No slots for this date.</p>
                ) : (
                  manageSlots.map((slot) => (
                    <div key={slot.id} className={`${styles.slotBtn} ${slot.is_available ? styles.slotAvailable : styles.slotBooked}`}>
                      <span>{slot.start_time}:00 {slot.start_period} – {slot.end_time}:00 {slot.end_period}</span>
                      <span className={styles.slotStatus}>{slot.is_available ? "Available" : "Booked"}</span>
                      {slot.is_available && (
                        <button className={styles.removeSlotBtn} onClick={() => handleDeleteSlot(slot.id)}>✕</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Reviews & Ratings</h3>

          {reviews.length === 0 ? (
            <p className={styles.slotInfo}>No reviews yet.</p>
          ) : (
            <div className={styles.reviewsList}>
              {reviews.map((r) => (
                <div key={r.id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewUser}>{r.user?.username || "User"}</span>
                    <span className={styles.reviewRating}>{"⭐".repeat(r.rating)} ({r.rating}/5)</span>
                  </div>
                  {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                  {r.user?.id == userId && (
                    <button className={styles.removeSlotBtn} onClick={handleDeleteReview}>Delete my review</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isOwnProfile && (
            <div className={styles.reviewForm}>
              <h4 className={styles.reviewFormTitle}>Leave a Review</h4>
              <select
                className={styles.hourSelect}
                value={reviewRating}
                onChange={(e) => setReviewRating(e.target.value)}
              >
                <option value="">Select Rating</option>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>{"⭐".repeat(r)} ({r})</option>
                ))}
              </select>
              <textarea
                className={styles.reviewTextarea}
                placeholder="Write a comment (optional)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
              <button
                className={styles.addSlotBtn}
                onClick={handleSubmitReview}
                disabled={!reviewRating}
              >
                Submit Review
              </button>
              {reviewMsg && <p className={styles.successMsg}>{reviewMsg}</p>}
              {reviewError && <p className={styles.errorMsg}>{reviewError}</p>}
            </div>
          )}
        </div>
      </div>

      {showUpdateModal && (
        <UpdatePharmacistModal
          pharmacist={pharmacist}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => { setShowUpdateModal(false); onUpdateSuccess() }}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          title="Delete Pharmacist"
          message={`Are you sure you want to delete ${fullName || pharmacist.user.username}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  )
}
