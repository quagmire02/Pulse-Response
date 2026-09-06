"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { sendChatbotMessageAction } from "@/actions/chatbotActions"
import styles from "./page.module.css"

const GREETING = {
  role: "assistant",
  text:
    "Hello. Tell me what you are feeling and I will point you to the right kind of doctor on the platform. "
    + "If something is urgent, say so and I will show you the emergency option.",
}

export default function AssistantPage() {
  const router = useRouter()

  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()

    const text = input.trim()
    if (!text || busy) return

    setMessages((current) => [...current, { role: "user", text }])
    setInput("")
    setBusy(true)

    const result = await sendChatbotMessageAction(text)
    setBusy(false)

    if (result.error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: typeof result.error === "string" ? result.error : "Something went wrong. Try again.",
        },
      ])
      return
    }

    const reply = result.data

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: reply.reply,
        doctors: reply.doctors || [],
        action: reply.action,
        intent: reply.intent,
        source: reply.source,
        fallbackReason: reply.fallback_reason,
      },
    ])
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>AI Assistance</h1>
      </div>

      <p className={styles.disclaimer}>
        This assistant suggests which kind of specialist to see. It does not diagnose conditions
        or recommend medicines. For anything urgent, use the emergency alert.
      </p>

      <div className={styles.chat}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.row} ${message.role === "user" ? styles.rowUser : styles.rowBot}`}
          >
            <div
              className={`${styles.bubble} ${
                message.role === "user"
                  ? styles.bubbleUser
                  : message.intent === "emergency"
                  ? styles.bubbleEmergency
                  : styles.bubbleBot
              }`}
            >
              <p className={styles.text}>{message.text}</p>

              {message.doctors?.length > 0 && (
                <div className={styles.doctorList}>
                  {message.doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      className={styles.doctorCard}
                      onClick={() => router.push(`/pharmacist/${doctor.user_id}`)}
                    >
                      <span className={styles.doctorName}>{doctor.name}</span>
                      <span className={styles.doctorMeta}>
                        {doctor.speciality}
                        {doctor.rating ? ` · ${doctor.rating}/5` : ""}
                        {doctor.accepts_consultation ? " · books online" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {message.action && (
                <button
                  className={
                    message.intent === "emergency" ? styles.emergencyBtn : styles.actionBtn
                  }
                  onClick={() => router.push(message.action.href)}
                >
                  {message.action.label}
                </button>
              )}

              {message.fallbackReason && (
                <span className={styles.fallbackNote}>
                  AI unavailable: {message.fallbackReason}
                </span>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className={`${styles.row} ${styles.rowBot}`}>
            <div className={`${styles.bubble} ${styles.bubbleBot}`}>
              <p className={styles.text}>Thinking...</p>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form className={styles.composer} onSubmit={send}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe how you feel, or just say hello"
          disabled={busy}
          autoComplete="off"
        />
        <button type="submit" className={styles.sendBtn} disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
