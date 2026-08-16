"use client"

import React, { useState } from "react"
import Link from "next/link"
import styles from "./TimelineCard.module.css"

export default function TimelineCard({ item }) {
  const [showReceipt, setShowReceipt] = useState(false)

  const getTypeStyles = (type) => {
    switch (type) {
      case "purchase":
        return {
          icon: "💊",
          label: "Medicine Purchase",
          colorClass: styles.purchase,
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

          {item.type === "purchase" && (
            <Link href={`/orders`} className={styles.actionBtn}>
              View Orders ➔
            </Link>
          )}

          {item.type === "equipment" && item.details?.equipment_name && (
            <Link href={`/equipment`} className={styles.actionBtn}>
              View Equipment listings ➔
            </Link>
          )}

          {item.type === "payment" && (
            <button onClick={() => setShowReceipt(!showReceipt)} className={styles.actionBtn}>
              {showReceipt ? "Hide Receipt" : "View Receipt"} ➔
            </button>
          )}
        </div>

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
