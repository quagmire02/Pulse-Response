import Link from "next/link"
import { getMedicinesAction } from "@/actions/medicineActions"
import { getEquipmentAction } from "@/actions/equipmentActions"
import { medicineImage, equipmentImage } from "@/libs/images"
import FaqAccordion from "./FaqAccordion"
import styles from "./page.module.css"

export const dynamic = "force-dynamic"

const SERVICES = [
  {
    key: "medicines",
    title: "Medicines",
    text: "Search by brand or by chemical name. Out of stock items suggest the same medicine from another brand.",
    tint: styles.tintBlue,
  },
  {
    key: "equipment",
    title: "Equipment",
    text: "Wheelchairs, oxygen, monitors. Hire by the day or buy outright from verified local suppliers.",
    tint: styles.tintTeal,
  },
  {
    key: "doctors",
    title: "Consultations",
    text: "Browse doctors by speciality and rating, then book a slot that actually suits your day.",
    tint: styles.tintAmber,
  },
  {
    key: "emergency",
    title: "Emergency",
    text: "One tap sends your location to the nearest ambulance and alerts trained volunteers close by.",
    tint: styles.tintSlate,
  },
]

const STEPS = [
  {
    number: "01",
    title: "Create an account",
    text: "Customer accounts are instant. Doctors, pharmacists and suppliers are verified by an admin first.",
  },
  {
    number: "02",
    title: "Find what you need",
    text: "Search medicines, compare equipment, or describe a symptom and let the assistant point you to a specialist.",
  },
  {
    number: "03",
    title: "Checkout once",
    text: "Medicines and equipment share one cart and one checkout, with three delivery speeds to choose from.",
  },
]

const FAQS = [
  {
    q: "Do I need approval to sign up?",
    a: "Not as a customer, your account works straight away. Doctors, pharmacists, equipment suppliers and ambulance services are reviewed by an admin because those roles carry a licence.",
  },
  {
    q: "Can I rent equipment instead of buying it?",
    a: "Yes. Each listing shows whether the supplier offers it for rent by the day, for sale outright, or both. You agree a handover time and place with them after checkout.",
  },
  {
    q: "How does the emergency dispatch work?",
    a: "When you raise an alert with your location, the system finds the closest ambulance that is on duty, works out the driving route, and notifies that driver. Volunteers within a short distance are alerted at the same time.",
  },
  {
    q: "What does a subscription give me?",
    a: "Regular medicines can repeat weekly or monthly. The first order is full price and every renewal after that is 10% off. You can edit the items or cancel with seven days notice.",
  },
  {
    q: "Is the assistant giving medical advice?",
    a: "No. It suggests which kind of specialist handles your symptoms and links to doctors on the platform. It never diagnoses or recommends medicines.",
  },
]

async function loadCatalogue() {
  const [medicineResult, equipmentResult] = await Promise.all([
    getMedicinesAction({ per_page: 4, is_available: "true" }),
    getEquipmentAction({ per_page: 3, available_only: true }),
  ])

  return {
    medicines: medicineResult.error ? [] : medicineResult.data || [],
    equipment: equipmentResult.error ? [] : equipmentResult.data || [],
    counts: {
      medicines: medicineResult.pagination?.count || 0,
      equipment: equipmentResult.pagination?.count || 0,
    },
  }
}

export default async function WelcomePage() {
  const { medicines, equipment, counts } = await loadCatalogue()

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.brand}>
            <span className={styles.brandMark}>PR</span>
            Pulse Response
          </span>

          <nav className={styles.navLinks} aria-label="Primary">
            <a href="#services">Services</a>
            <a href="#browse">Browse</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className={styles.navActions}>
            <Link className={styles.ghostBtn} href="/auth/login">
              Log in
            </Link>
            <Link className={styles.pillBtn} href="/auth/signup">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Pharmacy, equipment and emergency care</span>
          <h1 className={styles.heroTitle}>
            Health support at <span className={styles.accent}>every stage</span> of life.
          </h1>
          <p className={styles.heroText}>
            Order medicines, hire or buy medical equipment, book a doctor, and call an
            ambulance that finds you automatically. Have a look around before you sign up.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.primaryBtn} href="/auth/signup">
              Create free account
            </Link>
            <Link className={styles.ghostBtn} href="/auth/login">
              I already have one
            </Link>
          </div>

          <div className={styles.trustRow}>
            <div className={styles.trustItem}>
              <strong>{counts.medicines}</strong>
              <span>medicines in stock</span>
            </div>
            <div className={styles.trustDivider} />
            <div className={styles.trustItem}>
              <strong>{counts.equipment}</strong>
              <span>equipment listings</span>
            </div>
            <div className={styles.trustDivider} />
            <div className={styles.trustItem}>
              <strong>24/7</strong>
              <span>emergency dispatch</span>
            </div>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.heroPanelInner}>
            <div className={styles.floatCard}>
              <span className={styles.floatLabel}>Nearest ambulance</span>
              <span className={styles.floatValue}>6 min away</span>
            </div>
            <div className={`${styles.floatCard} ${styles.floatCardLow}`}>
              <span className={styles.floatLabel}>Volunteers alerted</span>
              <span className={styles.floatValue}>3 within 2.5 km</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="services">
        <div className={styles.splitHead}>
          <div>
            <span className={styles.eyebrow}>What we do</span>
            <h2 className={styles.sectionTitle}>Our popular services</h2>
            <p className={styles.sectionText}>
              Four things the platform does well, all sharing one account and one checkout.
            </p>
          </div>
          <Link className={styles.primaryBtn} href="/auth/signup">
            Get started
          </Link>
        </div>

        <div className={styles.serviceGrid}>
          {SERVICES.map((service) => (
            <div key={service.key} className={`${styles.serviceTile} ${service.tint}`}>
              <h3 className={styles.serviceTitle}>{service.title}</h3>
              <p className={styles.serviceText}>{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      {medicines.length > 0 && (
        <section className={styles.sectionMuted} id="browse">
          <div className={styles.sectionInner}>
            <div className={styles.splitHead}>
              <div>
                <span className={styles.eyebrow}>Available now</span>
                <h2 className={styles.sectionTitle}>Medicines in stock today</h2>
              </div>
              <span className={styles.sectionHint}>Sign in to add to your cart</span>
            </div>

            <div className={styles.previewGrid}>
              {medicines.map((medicine) => (
                <article key={medicine.id} className={styles.previewCard}>
                  <div className={styles.previewImageWrap}>
                    <img
                      src={medicineImage(medicine)}
                      alt={medicine.name}
                      className={styles.previewImage}
                      width={260}
                      height={165}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className={styles.previewBody}>
                    <h3 className={styles.previewName}>{medicine.name}</h3>
                    {medicine.generic_name && (
                      <p className={styles.previewMeta}>{medicine.generic_name}</p>
                    )}
                    <p className={styles.previewPrice}>${medicine.price}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {equipment.length > 0 && (
        <section className={styles.section}>
          <div className={styles.splitHead}>
            <div>
              <span className={styles.eyebrow}>From local suppliers</span>
              <h2 className={styles.sectionTitle}>Rent it, or buy it</h2>
              <p className={styles.sectionText}>
                Every listing states which options the supplier offers.
              </p>
            </div>
          </div>

          <div className={styles.previewGrid}>
            {equipment.map((item) => {
              const forRent = Boolean(item.is_for_rent)
              const forSale = Boolean(item.is_for_sale) && item.sale_price !== null

              return (
                <article key={item.id} className={styles.previewCard}>
                  <div className={styles.previewImageWrap}>
                    <img
                      src={equipmentImage(item)}
                      alt={item.name}
                      className={styles.previewImage}
                      width={260}
                      height={165}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className={styles.offerChip}>
                      {forRent && forSale ? "Rent or Buy" : forSale ? "For Sale" : "For Rent"}
                    </span>
                  </div>
                  <div className={styles.previewBody}>
                    <h3 className={styles.previewName}>{item.name}</h3>
                    <p className={styles.previewMeta}>{item.category}</p>
                    <p className={styles.previewPrice}>
                      {forRent && <>${item.price_per_day}<small>/day</small></>}
                      {forRent && forSale && <span className={styles.priceSep}>·</span>}
                      {forSale && <>${item.sale_price}</>}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <section className={styles.sectionMuted} id="how">
        <div className={styles.sectionInner}>
          <div className={styles.centerHead}>
            <span className={styles.eyebrow}>Getting started</span>
            <h2 className={styles.sectionTitle}>Three steps, no paperwork</h2>
          </div>

          <div className={styles.stepGrid}>
            {STEPS.map((step) => (
              <div key={step.number} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>PULSE RESPONSE</h2>
          <p className={styles.ctaText}>
            One account for your medicines, your equipment, your doctor and your emergencies.
          </p>
          <Link className={styles.ctaBtn} href="/auth/signup">
            Create your account
          </Link>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <div className={styles.faqLayout}>
          <div className={styles.faqIntro}>
            <span className={styles.eyebrow}>Questions</span>
            <h2 className={styles.sectionTitle}>What people often ask</h2>
            <p className={styles.sectionText}>
              If something is not covered here, the in app assistant can answer once you
              are signed in.
            </p>
          </div>

          <FaqAccordion faqs={FAQS} />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrandCol}>
            <span className={styles.brand}>
              <span className={styles.brandMark}>PR</span>
              Pulse Response
            </span>
            <p className={styles.footerNote}>
              Pharmacy, equipment and emergency response in one place.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h3>Platform</h3>
            <a href="#services">Services</a>
            <a href="#browse">Browse</a>
            <a href="#how">How it works</a>
          </div>

          <div className={styles.footerCol}>
            <h3>Account</h3>
            <Link href="/auth/login">Log in</Link>
            <Link href="/auth/signup">Create account</Link>
          </div>

          <div className={styles.footerCol}>
            <h3>In an emergency</h3>
            <p className={styles.footerNote}>
              Always contact your local emergency number as well as raising an alert here.
            </p>
          </div>
        </div>

        <div className={styles.footerBar}>
          <span>Pulse Response</span>
          <span>Built as a university project</span>
        </div>
      </footer>
    </div>
  )
}
