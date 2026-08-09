"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/buttons/buttons"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import styles from "./Navbar.module.css"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const id = await getUserIdAction()
      const role = await getUserRoleAction()
      setUserId(id)
      setUserRole(role)
    }
    fetchUserData()
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleNavigation = (path) => {
    router.push(path)
    closeMenu()
  }

  const handleProfileClick = () => {
    if (userId) {
      handleNavigation(`/profile/${userId}`)
    } else {
      handleNavigation("/auth/login")
    }
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.logo} onClick={() => handleNavigation("/")}>
            <span>Pulse Response</span>
          </div>
          <button className={styles.menuButton} onClick={toggleMenu}>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>
        </div>
      </nav>

      <div className={`${styles.overlay} ${isMenuOpen ? styles.overlayOpen : ""}`} onClick={closeMenu}></div>

      <div className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.backButton} onClick={closeMenu}>
            ← Back
          </button>
        </div>

        <div className={styles.menuItems}>
          <button className={styles.menuItem} onClick={() => handleNavigation("/")}>
            Home
          </button>
          <button className={styles.menuItem} onClick={handleProfileClick}>
            Profile
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/medicines")}>
            Medicines
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/pharmacist")}>
            Pharmacists
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/cart")}>
            Cart
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/orders")}>
            Orders
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/payment")}>
            Payment History
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/deliver")}>
            Deliveries
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/notification")}>
            Notifications
          </button>
          

          {(userRole === "super_admin" || userRole === "admin") && (
            <button className={styles.menuItem} onClick={() => handleNavigation("/admin-dashboard")}>
              Admin Dashboard
            </button>
          )}

          <div className={styles.logoutContainer}>
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  )
}
