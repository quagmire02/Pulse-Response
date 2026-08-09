"use client"

import { useState, useEffect } from "react"
import { getMedicinesAction } from "@/actions/medicineActions"
import { getCategoriesAction } from "@/actions/categoryActions"
import Image from "next/image"
import styles from "./page.module.css"

export default function HomePage() {
  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [showAllMedicines, setShowAllMedicines] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medicinesResponse, categoriesResponse] = await Promise.all([
          getMedicinesAction({ per_page: 12 }),
          getCategoriesAction(),
        ])

        if (medicinesResponse.data) {
          setMedicines(medicinesResponse.data)
        }
        
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const displayedMedicines = showAllMedicines ? medicines : medicines.slice(0, 6)
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 8)

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <Image
            src="/1.jpg"
            alt="PulseResponse"
            fill
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroOverlay}></div>
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>PulseResponse</h1>
          <p className={styles.heroSubtitle}>Your Partner in Health and Wellness</p>
          <button className={styles.heroButton}>
            <a className={styles.medicineLink} href="/medicines">Explore Our Products</a>
          </button>
        </div>
      </section>

      {/* Pulse Response Story */}
      <section className={styles.storySection}>
        <div className={styles.storyContainer}>
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
              <h2 className={styles.storyTitle}>Our Story</h2>
              <p className={styles.storyText}>
                At Pulse Response, we believe that health is a journey, and we're here to support you every step of the way. Founded with a commitment to providing quality healthcare products and expert advice, we've created a space where your well-being comes first.
              </p>
              <p className={styles.storyText}>
                Our pharmacists and health specialists are dedicated to offering personalized care, sourcing the best medical supplies to help you lead a healthier life.
              </p>
              <div className={styles.storyFeatures}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <span className={styles.icon}>🛡️</span>
                  </div>
                  <p className={styles.featureText}>Premium Quality</p>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <span className={styles.icon}>🩺</span>
                  </div>
                  <p className={styles.featureText}>Fresh Daily</p>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <span className={styles.icon}>👨‍⚕️</span>
                  </div>
                  <p className={styles.featureText}>Family Owned</p>
                </div>
              </div>
            </div>
            <div className={styles.storyImageContainer}>
              <Image
                src="/6.jpg"
                alt="Pulse Response Story"
                width={500}
                height={600}
                className={styles.storyImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categoriesSection}>
        <div className={styles.categoriesContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Categories</h2>
            <p className={styles.sectionSubtitle}>
              Discover our carefully curated selection of culinary categories, each offering unique flavors and
              experiences.
            </p>
          </div>

          <div className={styles.categoriesGrid}>
            {displayedCategories.map((category) => (
              <div key={category.id} className={styles.categoryCard}>
                <div className={styles.categoryContent}>
                  <div className={styles.categoryIcon}>
                    <span className={styles.categoryLetter}>{category.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className={styles.categoryName}>{category.name}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sectionButton}>
            <button className={styles.showMoreButton} onClick={() => setShowAllCategories(!showAllCategories)}>
              {showAllCategories ? (
                <>
                  Show Less <span className={styles.buttonIcon}>⬆️</span>
                </>
              ) : (
                <>
                  Show More <span className={styles.buttonIcon}>⬇️</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Featured Medicines Section */}
      <section className={styles.medicinesSection}>
        <div className={styles.medicinesContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Products</h2>
            <p className={styles.sectionSubtitle}>
              Discover our most popular and essential products for your well-being.
            </p>
          </div>

          <div className={styles.medicinesGrid}>
            {displayedMedicines.map((medicine) => (
              <div key={medicine.id} className={styles.medicineCard}>
                <div className={styles.medicineImageContainer}>
                  <Image
                    src={
                      medicine.image_url
                      ? `${process.env.NEXT_PUBLIC_BASE_URL}/${medicine.image_url}`
                      : "/placeholder.svg?height=200&width=200&query=medicine"
                    }
                    alt={medicine.name}
                    fill
                    className={styles.medicineImage}
                  />
                  <div className={styles.medicinePrice}>${medicine.price}</div>
                </div>
                <div className={styles.medicineContent}>
                  <h3 className={styles.medicineName}>{medicine.name}</h3>
                  <p className={styles.medicineDescription}>{medicine.description}</p>
                  <div className={styles.medicineStats}>
                    <span className={styles.medicineStat}>Stock: {medicine.stock}</span>
                    <span className={styles.medicineStat}>Sold: {medicine.sold}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sectionButton}>
            <button className={styles.showMoreButton} onClick={() => setShowAllMedicines(!showAllMedicines)}>
              {showAllMedicines ? (
                <>
                  Show Less <span className={styles.buttonIcon}>⬆️</span>
                </>
              ) : (
                <>
                  Show More <span className={styles.buttonIcon}>⬇️</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>


    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <h2 className={styles.ctaTitle}>Ready to Prioritize Your Health?</h2>
        <p className={styles.ctaSubtitle}>
          Shop with us for all your medical and wellness needs, and experience reliable service.
        </p>
        <div className={styles.ctaButtons}>
          <button className={styles.ctaPrimary}>
            <a className={styles.medicineLink1} href="/products">Shop Now</a>
          </button>
          <button className={styles.ctaSecondary}>
            <a className={styles.medicineLink2} href="/products">View All Products</a>
          </button>
        </div>
      </div>
    </section>
  </div>
)
}
