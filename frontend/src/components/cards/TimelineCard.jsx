"use client"

import React, { useState } from "react"
import Link from "next/link"
import { getLedgerEntryAction } from "@/actions/ledgerActions"
import styles from "./TimelineCard.module.css"

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`

const readableDate = (value) =>
  value ? new Date(value).toLocaleString() : "N/A"

/**
 * Turn one fetched record into label/value pairs. Each timeline type has a
 * different shape, so the mapping lives here rather than in the markup.
 */
function summarise(type, data) {
  // Both order categories return the same order record, so they read the same.
  if (type === "purchase" || type === "equipment_purchase") {
    const items = (data.order_items || [])
      .map((line) => {
        const name = line.medicine?.name || line.equipment?.name || "Item"
        return `${line.quantity} x ${name}`
      })
      .join(", ")

    return {
      "Order": `#${data.id}`,
      "Placed": readableDate(data.order_date),
      "Items": items || "None",
      "Order status": data.order_status,
      "Payment status": data.payment_status,
      "Delivery": data.delivery?.delivery_type || "N/A",
      "Tracking": data.delivery?.track_num || "N/A",
      "Address": data.delivery_address || "N/A",
      "Total": money(data.total_amount),
    }
  }

  if (type === "equipment") {
    return {
      "Rental": `#${data.id}`,
      "Equipment": data.equipment?.name || "N/A",
      "Supplier": data.vendor?.company_name || "N/A",
      "Contact": data.vendor?.contact_phone || "N/A",
      "From": data.rental_start,
      "To": data.rental_end,
      "Status": data.status,
      "Total": money(data.total_price),
    }
  }

  if (type === "consultation") {
    const doctor = data.slot?.pharmacist?.user
    return {
      "Consultation": `#${data.id}`,
      "Doctor": doctor
        ? `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim() || doctor.username
        : "N/A",
      "Date": data.slot?.date || "N/A",
      "Time": data.slot ? `${data.slot.start_time}:00` : "N/A",
      "Status": data.status || "booked",
    }
  }

  if (type === "emergency") {
    return {
      "Alert": `#${data.id}`,
      "Type": String(data.alert_type || "").replace(/_/g, " "),
      "Location": data.location,
      "Status": data.status,
      "Ambulance": data.assigned_vehicle?.vehicle_number || "Not assigned",
      "ETA given": data.assigned_eta_minutes ? `${data.assigned_eta_minutes} min` : "N/A",
      "Raised": readableDate(data.created_at),
    }
  }

  return {
    "Payment": `#${data.id}`,
    "Order": `#${data.order_id}`,
    "Method": String(data.payment_type || "").toUpperCase(),
    "Paid at": readableDate(data.payment_date),
    "Order total": money(data.order?.total_amount),
  }
}

export default function TimelineCard({ item }) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState("")

  const toggleDetail = async () => {
    if (showDetail) {
      setShowDetail(false)
      return
    }

    // Fetch once, then just re-open on subsequent clicks.
    if (detail) {
      setShowDetail(true)
      return
    }

    setLoadingDetail(true)
    setDetailError("")

    const result = await getLedgerEntryAction(item.type, item.id)
    setLoadingDetail(false)

    if (result.error) {
      setDetailError(
        typeof result.error === "string" ? result.error : "Could not load this record."
      )
      return
    }

    setDetail(result.data)
    setShowDetail(true)
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case "purchase":
        return {
          icon: "💊",
          label: "Medicine Purchase",
          colorClass: styles.purchase,
        }
      case "equipment_purchase":
        return {
          icon: "🛒",
          label: "Equipment Purchase",
          colorClass: styles.equipmentPurchase,
        }
      case "equipment":
        return {
          icon: "🏥",
          label: "Equipment Rental",
          colorClass: styles.equipment,
        }
      case "consultation":
        return {
          icon: "🩺",
          label: "Doctor Visit",
          colorClass: styles.consultation,
        }
      case "emergency":
        return {
          icon: "🚨",
          label: "Emergency Alert",
          colorClass: styles.emergency,
        }
      case "payment":
        return {
          icon: "💳",
          label: "Payment Receipt",
          colorClass: styles.payment,
        }
      default:
        return {
          icon: "📅",
          label: "Activity",
          colorClass: styles.default,
        }
    }
  }

  const { icon, label, colorClass } = getTypeStyles(item.type)

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={`${styles.card} ${colorClass}`}>
      <div className={styles.timelineIconWrapper}>
        <span className={styles.timelineIcon}>{icon}</span>
        <div className={styles.timelineLine}></div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.header}>
          <span className={styles.typeBadge}>{label}</span>
          <span className={styles.date}>{formatDate(item.date)}</span>
        </div>

        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.description}>{item.description}</p>

        {item.amount > 0 && (
          <div className={styles.amountRow}>
            <span className={styles.amountLabel}>Amount:</span>
            <span className={styles.amountValue}>${parseFloat(item.amount).toFixed(2)}</span>
          </div>
        )}

        <div className={styles.footer}>
          <span className={`${styles.statusBadge} ${styles[item.status] || styles.pending}`}>
            {item.status || "Completed"}
          </span>

          {/* Loads only this record, instead of sending the user to a list. */}
          <button onClick={toggleDetail} className={styles.actionBtn} disabled={loadingDetail}>
            {loadingDetail ? "Loading..." : showDetail ? "Hide details" : "View details"}
          </button>

          {(item.type === "purchase" || item.type === "equipment_purchase") && (
            <Link href={`/orders/${item.id}`} className={styles.actionBtn}>
              Open order #{item.id}
            </Link>
          )}

          {item.type === "payment" && (
            <button onClick={() => setShowReceipt(!showReceipt)} className={styles.actionBtn}>
              {showReceipt ? "Hide Receipt" : "View Receipt"} ➔
            </button>
          )}
        </div>

        {detailError && <div className={styles.detailError}>{detailError}</div>}

        {showDetail && detail && (
          <div className={styles.detailPanel}>
            {Object.entries(summarise(item.type, detail)).map(([label, value]) => (
              <div key={label} className={styles.detailRow}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}

        {showReceipt && item.type === "payment" && (
          <div className={styles.receipt}>
            <div className={styles.receiptHeader}>
              <h4>Payment Receipt</h4>
              <span className={styles.receiptNumber}>#PAY-{item.id}</span>
            </div>
            <div className={styles.receiptBody}>
              <div className={styles.receiptRow}>
                <span>Order Reference:</span>
                <strong>#{item.details?.order_id || item.id}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Payment Type:</span>
                <strong>{item.details?.payment_type ? item.details.payment_type.toUpperCase() : "N/A"}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Transaction Date:</span>
                <strong>{formatDate(item.date)}</strong>
              </div>
              <div className={styles.receiptDivider}></div>
              <div className={styles.receiptTotalRow}>
                <span>Total Paid:</span>
                <strong>${parseFloat(item.amount).toFixed(2)}</strong>
              </div>
            </div>
            <div className={styles.receiptFooter}>
              <span>Status: SUCCESSFUL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
