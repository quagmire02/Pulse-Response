"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboardCard from "@/components/cards/AdminDashboardCard"
import { getPendingSignupRequestCountAction } from "@/actions/signupRequestActions"
import styles from "./page.module.css"

export default function AdminDashboard() {
  const router = useRouter()
  const [pendingSignups, setPendingSignups] = useState(0)

  useEffect(() => {
    const loadPendingSignups = async () => {
      const result = await getPendingSignupRequestCountAction()
      if (!result.error) {
        setPendingSignups(result.data || 0)
      }
    }
    loadPendingSignups()
  }, [])

  const dashboardOptions = [
    {
      id: 0,
      title: "Signup Requests",
      description:
        pendingSignups > 0
          ? `${pendingSignups} request${pendingSignups !== 1 ? "s" : ""} awaiting approval`
          : "Approve or reject new account requests",
      icon: "📝",
      route: "/admin-dashboard/signup-requests",
    },
    {
      id: 1,
      title: "Manage Medicines",
      description: "View, edit and delete medicine items",
      icon: "💊",
      route: "/admin-dashboard/medicines",
    },
    {
      id: 2,
      title: "Manage Categories",
      description: "Create, edit and delete categories",
      icon: "📂",
      route: "/admin-dashboard/categories",
    },
    {
      id: 3,
      title: "Manage Orders",
      description: "View and manage customer orders",
      icon: "📋",
      route: "/admin-dashboard/orders",
    },
    {
      id: 4,
      title: "Create Pharmacist",
      description: "Create new pharmacist accounts",
      icon: "👥",
      route: "/pharmacist",
    },
    {
      id: 6,
      title: "Ambulance Fleet",
      description: "Register ambulances and track drivers live",
      icon: "🚑",
      route: "/admin-dashboard/ambulances",
    },
    {
      id: 5,
      title: "Manage Vendors",
      description: "Create and manage vendor accounts",
      icon: "🏪",
      route: "/admin-dashboard/vendors",
    },
  ]

  const handleCardClick = (route) => {
    router.push(route)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage accounts, catalogue and orders</p>
      </div>

      <div className={styles.grid}>
        {dashboardOptions.map((option) => (
          <AdminDashboardCard
            key={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onClick={() => handleCardClick(option.route)}
          />
        ))}
      </div>
    </div>
  )
}
