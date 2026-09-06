"use client"

import { useState } from "react"
import styles from "./page.module.css"

export default function FaqAccordion({ faqs }) {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className={styles.faqList}>
      {faqs.map((faq, index) => {
        const isOpen = openFaq === index
        const panelId = `faq-panel-${index}`
        const buttonId = `faq-button-${index}`

        return (
          <div key={faq.q} className={styles.faqItem}>
            <h3 className={styles.faqHeading}>
              <button
                id={buttonId}
                type="button"
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span>{faq.q}</span>
                <span className={styles.faqToggle} aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <p
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={styles.faqAnswer}
              hidden={!isOpen}
            >
              {faq.a}
            </p>
          </div>
        )
      })}
    </div>
  )
}
