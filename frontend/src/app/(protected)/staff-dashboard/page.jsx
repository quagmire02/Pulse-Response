"use client";
import { useRouter } from "next/navigation";
import AdminDashboardCard from "@/components/cards/AdminDashboardCard";
import styles from "./page.module.css";

export default function OrdersPage() {
  const router = useRouter();

  const handleAllOrdersClick = () => {
    router.push("/staff-dashboard/orders/all");
  };

  const handleNewOrdersClick = () => {
    router.push("/staff-dashboard/orders/new");
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title1}>Staff Dashboard</h1>
          <p className={styles.subtitle}>Choose the type of orders to manage</p>
        </div>

        <div className={styles.cardGrid}>
          <AdminDashboardCard
            title="All Orders"
            description="View and manage all orders in the system"
            icon="📋"
            buttonText="View All Orders"
            onClick={handleAllOrdersClick}
          />

          <AdminDashboardCard
            title="New Orders"
            description="View and manage recently placed orders"
            icon="🆕"
            buttonText="View New Orders"
            onClick={handleNewOrdersClick}
          />
        </div>
      </main>
    </div>
  );
}
