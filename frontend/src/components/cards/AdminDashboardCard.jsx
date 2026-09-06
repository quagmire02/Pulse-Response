"use client"

import {AdminDashboardButton }from "@/components/buttons/buttons"
import styles from "./AdminDashboardCard.module.css"

export default function AdminDashboardCard({ title, description, icon, onClick }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconContainer}>
        <span className={styles.icon}>{icon}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.buttonContainer}>
        <AdminDashboardButton onClick={onClick}>Access {title}</AdminDashboardButton>
      </div>
    </div>
  )
}
