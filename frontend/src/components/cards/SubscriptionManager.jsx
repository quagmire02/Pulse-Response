"use client"

import { useState } from "react"
import {
  cancelSubscriptionAction,
  updateSubscriptionItemsAction,
} from "@/actions/subscriptionActions"
import { getMedicineSuggestionsAction } from "@/actions/medicineActions"
import styles from "./SubscriptionManager.module.css"

const NOTICE_DAYS = 7

export default function SubscriptionManager({ subscription, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [lines, setLines] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])

  const [confirmCancel, setConfirmCancel] = useState(false)

  const isPending = subscription.order_status === "pending"

  const daysUntilNext = subscription.next_delivery_date
    ? Math.ceil(
        (new Date(subscription.next_delivery_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : null
  const canCancel = daysUntilNext !== null && daysUntilNext >= NOTICE_DAYS

  const startEditing = () => {
    setLines(
      (subscription.order_items || [])
        .filter((item) => item.medicine)
        .map((item) => ({
          medicine_id: item.medicine.id,
          name: item.medicine.name,
          price: Number(item.medicine.price),
          quantity: item.quantity,
        }))
    )
    setEditing(true)
    setError("")
    setMessage("")
  }

  const changeQuantity = (medicineId, quantity) => {
    if (quantity < 1) return
    setLines((current) =>
      current.map((line) =>
        line.medicine_id === medicineId ? { ...line, quantity } : line
      )
    )
  }

  const removeLine = (medicineId) => {
    setLines((current) => current.filter((line) => line.medicine_id !== medicineId))
  }

  const handleSearch = async (value) => {
    setSearch(value)

    if (!value.trim()) {
      setSuggestions([])
      return
    }

    const result = await getMedicineSuggestionsAction(value)
    setSuggestions(result.error ? [] : result.data)
  }

  const addMedicine = (medicine) => {
    setSearch("")
    setSuggestions([])

    setLines((current) => {
      const existing = current.find((line) => line.medicine_id === medicine.id)

      if (existing) {
        return current.map((line) =>
          line.medicine_id === medicine.id ? { ...line, quantity: line.quantity + 1 } : line
        )
      }

      return [
        ...current,
        {
          medicine_id: medicine.id,
          name: medicine.name,
          price: Number(medicine.price),
          quantity: 1,
        },
      ]
    })
  }

  const save = async () => {
    if (lines.length === 0) {
      setError("Keep at least one medicine, or cancel the subscription instead.")
      return
    }

    setBusy(true)
    setError("")

    const result = await updateSubscriptionItemsAction(
      subscription.id,
      lines.map((line) => ({ medicine_id: line.medicine_id, quantity: line.quantity }))
    )

    setBusy(false)

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      return
    }

    setMessage(result.success || "Subscription updated.")
    setEditing(false)
    if (onChanged) onChanged()
  }

  const cancel = async () => {
    setBusy(true)
    setError("")

    const result = await cancelSubscriptionAction(subscription.id)
    setBusy(false)
    setConfirmCancel(false)

    if (result.error) {
      setError(typeof result.error === "object" ? JSON.stringify(result.error) : result.error)
      return
    }

    setMessage(result.success || "Subscription cancelled.")
    if (onChanged) onChanged()
  }

  const previewTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const previewDiscount = previewTotal * 0.1

  return (
    <div className={styles.manager}>
      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {editing ? (
        <div className={styles.editor}>
          <h4 className={styles.editorTitle}>Medicines on your next delivery</h4>

          {lines.length === 0 ? (
            <p className={styles.hint}>No medicines selected.</p>
          ) : (
            <div className={styles.lineList}>
              {lines.map((line) => (
                <div key={line.medicine_id} className={styles.line}>
                  <span className={styles.lineName}>{line.name}</span>
                  <div className={styles.qtyControls}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => changeQuantity(line.medicine_id, line.quantity - 1)}
                      disabled={busy || line.quantity <= 1}
                    >
                      -
                    </button>
                    <span className={styles.qty}>{line.quantity}</span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => changeQuantity(line.medicine_id, line.quantity + 1)}
                      disabled={busy}
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.linePrice}>
                    ${(line.price * line.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeLine(line.medicine_id)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.addBlock}>
            <label className={styles.label} htmlFor={`add-${subscription.id}`}>
              Add a medicine
            </label>
            <input
              id={`add-${subscription.id}`}
              className={styles.input}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Start typing a medicine name"
              autoComplete="off"
              disabled={busy}
            />
            {suggestions.length > 0 && (
              <ul className={styles.suggestions}>
                {suggestions.map((medicine) => (
                  <li
                    key={medicine.id}
                    className={styles.suggestion}
                    onMouseDown={() => addMedicine(medicine)}
                  >
                    <span>{medicine.name}</span>
                    <span className={styles.suggestionMeta}>
                      ${medicine.price}
                      {medicine.stock <= 0 ? " · out of stock" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.preview}>
            <span>Subtotal ${previewTotal.toFixed(2)}</span>
            <span className={styles.previewDiscount}>
              Renewal discount -${previewDiscount.toFixed(2)}
            </span>
            <strong>Next charge about ${(previewTotal - previewDiscount).toFixed(2)}</strong>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(false)} disabled={busy}>
              Discard
            </button>
            <button className={styles.primaryBtn} onClick={save} disabled={busy}>
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      ) : confirmCancel ? (
        <div className={styles.confirmBlock}>
          <p className={styles.confirmText}>
            Stop renewing this subscription? Anything already scheduled still ships, but no
            new deliveries will be created and you lose the 10% renewal discount.
          </p>
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => setConfirmCancel(false)} disabled={busy}>
              Keep subscription
            </button>
            <button className={styles.dangerBtn} onClick={cancel} disabled={busy}>
              {busy ? "Cancelling..." : "Confirm unsubscribe"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {isPending && (
            <button className={styles.secondaryBtn} onClick={startEditing}>
              Edit next delivery
            </button>
          )}
          <button
            className={styles.dangerBtn}
            onClick={() => setConfirmCancel(true)}
            disabled={!canCancel}
            title={
              canCancel
                ? ""
                : `Subscriptions must be cancelled at least ${NOTICE_DAYS} days before the next delivery`
            }
          >
            Unsubscribe
          </button>
        </div>
      )}

      {!editing && !confirmCancel && !canCancel && (
        <p className={styles.hint}>
          {daysUntilNext === null
            ? "No delivery scheduled."
            : `Your next delivery is in ${daysUntilNext} day(s). Unsubscribing needs ${NOTICE_DAYS} days' notice.`}
        </p>
      )}
    </div>
  )
}
