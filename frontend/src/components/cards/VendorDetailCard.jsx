"use client"

import { useState, useEffect } from "react"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import { getVendorEquipmentAction } from "@/actions/equipmentActions"
import { deleteUserAction } from "@/actions/userActions"
import EquipmentCard from "@/components/cards/EquipmentCard"
import UpdateVendorModal from "@/components/modals/UpdateVendorModal"
import CreateEquipmentModal from "@/components/modals/CreateEquipmentModal"
import DeleteModal from "@/components/modals/DeleteModal"
import styles from "./VendorDetailCard.module.css"

export default function VendorDetailCard({ vendor, onUpdateSuccess, onDeleteSuccess }) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showCreateEqModal, setShowCreateEqModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState(null)

  const [equipmentList, setEquipmentList] = useState([])
  const [eqLoading, setEqLoading] = useState(true)

  const isOwnProfile = currentUserId == vendor.user_id
  const isAdmin = currentUserRole === "admin" || currentUserRole === "super_admin"
  const canManage = isOwnProfile || isAdmin

  const fetchEquipment = async () => {
    setEqLoading(true)
    const result = await getVendorEquipmentAction(vendor.user_id)
    if (!result.error) {
      setEquipmentList(result.data || [])
    }
    setEqLoading(false)
  }

  useEffect(() => {
    const fetchUser = async () => {
      const id = await getUserIdAction()
      const role = await getUserRoleAction()
      setCurrentUserId(id)
      setCurrentUserRole(role)
    }
    fetchUser()
    fetchEquipment()
  }, [vendor.user_id])

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError("")
    try {
      const result = await deleteUserAction(vendor.user_id)
      if (result.error) {
        setDeleteError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      } else {
        setShowDeleteModal(false)
        onDeleteSuccess()
      }
    } catch {
      setDeleteError("Failed to delete vendor account.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const fullName = `${vendor.user?.first_name || ""} ${vendor.user?.last_name || ""}`.trim()

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.avatar}>🏪</div>
            <div>
              <h1 className={styles.companyName}>{vendor.company_name}</h1>
              <span className={styles.licenseBadge}>License: {vendor.license_num}</span>
            </div>
          </div>

          <div className={styles.actions}>
            {canManage && (
              <button onClick={() => setShowUpdateModal(true)} className={styles.editBtn}>
                Edit Profile
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
                Delete Vendor
              </button>
            )}
          </div>
        </div>

        <div className={styles.body}>
          {vendor.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>About Vendor</h3>
              <p className={styles.description}>{vendor.description}</p>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact & Location</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>Contact Person:</strong> {fullName || vendor.user?.username || "N/A"}
              </div>
              <div className={styles.infoItem}>
                <strong>Email Address:</strong> {vendor.user?.email || "N/A"}
              </div>
              {vendor.contact_phone && (
                <div className={styles.infoItem}>
                  <strong>Phone Number:</strong> {vendor.contact_phone}
                </div>
              )}
              {vendor.user?.address && (
                <div className={styles.infoItem}>
                  <strong>Location:</strong> {vendor.user.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.listingsHeader}>
        <h2 className={styles.listingsTitle}>Equipment Listings</h2>
        {canManage && (
          <button onClick={() => setShowCreateEqModal(true)} className={styles.addEqBtn}>
            + Add Equipment
          </button>
        )}
      </div>

      {eqLoading ? (
        <div className={styles.loading}>Loading equipment...</div>
      ) : (
        <div className={styles.grid}>
          {equipmentList.length > 0 ? (
            equipmentList.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))
          ) : (
            <div className={styles.noData}>No equipment listings found for this vendor.</div>
          )}
        </div>
      )}

      {showUpdateModal && (
        <UpdateVendorModal
          vendor={vendor}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            setShowUpdateModal(false)
            onUpdateSuccess()
          }}
        />
      )}

      {showCreateEqModal && (
        <CreateEquipmentModal
          onClose={() => setShowCreateEqModal(false)}
          onSuccess={() => {
            setShowCreateEqModal(false)
            fetchEquipment()
          }}
          userRole={currentUserRole}
          initialVendorId={vendor.id}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          title="Delete Vendor"
          message={`Are you sure you want to delete the vendor "${vendor.company_name}"? All associated account data will be removed. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  )
}
