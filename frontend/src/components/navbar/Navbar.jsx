"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/buttons/buttons"
import { getUserIdAction, getUserRoleAction } from "@/actions/authActions"
import { getPharmacistAction } from "@/actions/pharmacistActions"
import { getVendorAction } from "@/actions/vendorActions"
import { getAmbulanceCompanyAction, getMyAmbulanceAction } from "@/actions/ambulanceActions"
import { getVolunteerProfileAction } from "@/actions/volunteerActions"
import { isAdminRole, isCustomerRole } from "@/libs/roles"
import NotificationBell from "./NotificationBell"
import styles from "./Navbar.module.css"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isDoctor, setIsDoctor] = useState(false)
  const [isVendor, setIsVendor] = useState(false)
  const [isAmbulanceCompany, setIsAmbulanceCompany] = useState(false)
  const [isDriver, setIsDriver] = useState(false)
  const [isVolunteer, setIsVolunteer] = useState(false)
  const router = useRouter()

  const isAdmin = isAdminRole(userRole)

  const isCustomer = isCustomerRole(userRole)

  useEffect(() => {
    const fetchUserData = async () => {
      const id = await getUserIdAction()
      const role = await getUserRoleAction()
      setUserId(id)
      setUserRole(role)
      if (id) {
        const result = await getPharmacistAction(id)
        setIsDoctor(!result.error)

        const vendorResult = await getVendorAction(id)
        setIsVendor(!vendorResult.error)

        const ambulanceResult = await getAmbulanceCompanyAction(id)
        setIsAmbulanceCompany(!ambulanceResult.error)

        const vehicleResult = await getMyAmbulanceAction()
        setIsDriver(!vehicleResult.error)

        const volunteerResult = await getVolunteerProfileAction()
        setIsVolunteer(!volunteerResult.error)
      }
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
          <div className={styles.navActions}>

            <NotificationBell />
            <button className={styles.menuButton} onClick={toggleMenu}>
              <span className={styles.hamburger}></span>
              <span className={styles.hamburger}></span>
              <span className={styles.hamburger}></span>
            </button>
          </div>
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
          <button className={styles.menuItem} onClick={() => handleNavigation("/equipment")}>
            Equipments
          </button>

          <button className={styles.menuItem} onClick={() => handleNavigation("/pharmacist")}>
            Consultants
          </button>

          {(isCustomer || isAdmin) && (
            <>
              <button className={styles.menuItem} onClick={() => handleNavigation("/assistant")}>
                AI Assistance
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigation("/cart")}>
                Cart
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigation("/orders")}>
                Orders
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigation("/subscriptions")}>
                Subscriptions
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigation("/membership")}>
                Premium Membership
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigation("/payment")}>
                Payment History
              </button>
              <button className={styles.menuItem} onClick={() => handleNavigation("/deliver")}>
                Deliveries
              </button>
            </>
          )}

          <button className={styles.menuItem} onClick={() => handleNavigation("/history")}>
            Medical Ledger 📋
          </button>
          <button className={styles.menuItem} onClick={() => handleNavigation("/notification")}>
            Notifications
          </button>

          {isDoctor && (
            <button className={styles.menuItem} onClick={() => handleNavigation(`/pharmacist/${userId}`)}>
              My Doctor Profile
            </button>
          )}

          {userRole === "pharmacist" && (
            <button className={styles.menuItem} onClick={() => handleNavigation("/admin-dashboard/medicines")}>
              Manage Medicines
            </button>
          )}

          {isVendor && (
            <button className={styles.menuItem} onClick={() => handleNavigation(`/vendor/${userId}`)}>
              My Vendor Profile
            </button>
          )}

          {isVolunteer && (
            <button className={styles.menuItem} onClick={() => handleNavigation("/volunteer")}>
              Volunteer Console
            </button>
          )}

          {isDriver && (
            <button className={styles.menuItem} onClick={() => handleNavigation("/driver")}>
              Driver Console
            </button>
          )}

          <button className={styles.menuItem} onClick={() => handleNavigation("/partner-dashboard")}>
            Analytics Dashboard
          </button>

          {isAdmin && (
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
