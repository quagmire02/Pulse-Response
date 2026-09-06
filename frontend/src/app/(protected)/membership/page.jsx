"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getMembershipAction,
  subscribeMembershipAction,
  renewMembershipAction,
  cancelMembershipAction,
  getPaymentLedgerAction,
} from "@/actions/membershipActions"
import { StatTile } from "@/components/charts/Charts"
import { toastSuccess, toastError } from "@/libs/toast"
import styles from "./page.module.css"

/**
 * Stripe's built in test payment methods. In a production build these would be
 * replaced by a Stripe.js card element that returns a real token; the server
 * side of the flow is identical either way.
 */
const TEST_METHODS = [
  { value: "pm_card_visa", label: "Visa, succeeds" },
  { value: "pm_card_mastercard", label: "Mastercard, succeeds" },
  { value: "pm_card_chargeDeclined", label: "Card declined, to test a failure" },
  { value: "pm_card_chargeDeclinedInsufficientFunds", label: "Insufficient funds" },
]

const money = (value, currency = "usd") =>
  `${currency === "usd" ? "$" : ""}${Number(value ?? 0).toFixed(2)}${currency === "usd" ? "" : " " + currency.toUpperCase()}`

export default function MembershipPage() {
  const router = useRouter()

  const [membership, setMembership] = useState(null)
  const [ledger, setLedger] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [paymentMethod, setPaymentMethod] = useState(TEST_METHODS[0].value)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const [statusResult, ledgerResult] = await Promise.all([
      getMembershipAction(),
      getPaymentLedgerAction(),
    ])

    if (statusResult.error) {
      setError(typeof statusResult.error === "string" ? statusResult.error : "Failed to load membership.")
    } else {
      setMembership(statusResult.data)
    }

    if (!ledgerResult.error) {
      setLedger(ledgerResult.data || [])
      setSummary(ledgerResult.summary || null)
    }

    setLoading(false)
  }

  const run = async (key, action) => {
    setBusy(key)
    setError("")
    setMessage("")

    const result = await action()
    setBusy("")

    if (result.error) {
      const reason = typeof result.error === "object" ? JSON.stringify(result.error) : result.error
      setError(reason)
      toastError(reason)
    } else {
      setMessage(result.success)
      toastSuccess(result.success)
    }

    load()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading membership</div>
      </div>
    )
  }

  const currency = membership?.currency || "usd"
  const expires = membership?.premium_expires_at
    ? new Date(membership.premium_expires_at).toLocaleDateString()
    : null

  // Each successful charge stacks another 30 days, so show what is left.
  const daysLeft = membership?.premium_expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(membership.premium_expires_at) - new Date()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Premium Membership</h1>
      </div>

      <p className={styles.subtitle}>
        Monthly membership billed through Stripe. Your card is stored by Stripe and charged
        by reference, so no card details are ever kept on this site.
      </p>

      {!membership?.provider_configured && (
        <div className={styles.warning}>
          Payments are not configured. Add <code>STRIPE_SECRET</code> to the backend .env file
          and restart the API.
        </div>
      )}

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {membership?.is_premium && (
        <div className={styles.accessBanner}>
          <div>
            <span className={styles.accessLabel}>Premium access active</span>
            <span className={styles.accessValue}>Until {expires}</span>
          </div>
          <span className={styles.accessDays}>
            {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
          </span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <StatTile
          label="Status"
          value={membership?.is_premium ? "Premium" : "Free"}
          hint={expires ? `Active until ${expires}` : "No active period"}
        />
        <StatTile label="Monthly price" value={money(membership?.monthly_price, currency)} />
        <StatTile
          label="Auto renewal"
          value={membership?.auto_renew ? "On" : "Off"}
          hint={membership?.has_saved_card ? "Card saved with Stripe" : "No card saved"}
        />
        {summary && (
          <StatTile
            label="Total collected"
            value={money(summary.total_collected, currency)}
            hint={`${summary.succeeded_count} succeeded, ${summary.failed_count} failed`}
          />
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          {membership?.has_saved_card ? "Billing" : "Start your membership"}
        </h2>

        {!membership?.has_saved_card && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="payment_method">
              Test card
            </label>
            <select
              id="payment_method"
              className={styles.select}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={busy !== ""}
            >
              {TEST_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <span className={styles.hint}>
              These are Stripe sandbox tokens. Pick a declining card to see a failed charge
              recorded in the ledger.
            </span>
          </div>
        )}

        <div className={styles.actions}>
          {!membership?.has_saved_card ? (
            <button
              className={styles.primaryBtn}
              onClick={() => run("subscribe", () => subscribeMembershipAction(paymentMethod))}
              disabled={busy !== "" || !membership?.provider_configured}
            >
              {busy === "subscribe" ? "Charging..." : `Subscribe for ${money(membership?.monthly_price, currency)}`}
            </button>
          ) : (
            <>
              <button
                className={styles.primaryBtn}
                onClick={() => run("renew", renewMembershipAction)}
                disabled={busy !== ""}
              >
                {busy === "renew" ? "Charging..." : "Charge next period now"}
              </button>
              {membership?.auto_renew && (
                <button
                  className={styles.dangerBtn}
                  onClick={() => run("cancel", cancelMembershipAction)}
                  disabled={busy !== ""}
                >
                  {busy === "cancel" ? "Cancelling..." : "Turn off auto renewal"}
                </button>
              )}
            </>
          )}
        </div>

        <p className={styles.note}>
          Each successful charge adds 30 days. Renewing twice gives you 60 days, and so on,
          so renewing early never loses you time. While your access is active you get 10% off
          medicines and equipment whenever you pay by card at checkout.
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Transaction ledger</h2>

        {ledger.length === 0 ? (
          <p className={styles.hint}>No transactions recorded yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>{String(row.type).replace(/_/g, " ")}</td>
                    <td>
                      {row.description}
                      {row.failure_reason && (
                        <span className={styles.failureReason}>{row.failure_reason}</span>
                      )}
                    </td>
                    <td className={styles.reference}>{row.provider_reference || "—"}</td>
                    <td>{money(row.amount, row.currency)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[row.status] || ""}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
