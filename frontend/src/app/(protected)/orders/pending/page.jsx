"use client";

import { useState, useEffect } from "react";
import { getOrdersAction } from "@/actions/orderActions";
import { createPaymentAction } from "@/actions/paymentActions";
import { getUserIdAction } from "@/actions/authActions";
import OrderCard from "@/components/cards/OrderCard";
import { useRouter } from "next/navigation"; 
import Link from "next/link";
import styles from "./page.module.css";

export default function PendingOrdersPage() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const userId = await getUserIdAction();

        const result = await getOrdersAction();
        if (result.error) {
          setError(result.error);
        } else {
          const filteredOrders = result.data.filter(
            (order) => order.user_id == userId && order.payment_status === "pending"
          );
          setPendingOrders(filteredOrders);
        }
      } catch (e) {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const confirmPayment = async (order_id) => {
    setError("");
    setSuccess("");

    try {
      const paymentFormData = new FormData()
      paymentFormData.append("order", order_id)
      paymentFormData.append("payment", "cash")
      console.log('order_id', order_id)
      for (const [key, value] of paymentFormData.entries()) {
        console.log(`${key}: ${value}`);
    }

      const paymentResult = await createPaymentAction(paymentFormData)

      if (paymentResult.error) {
        setError(paymentResult.error.error)
        return
      }

      setSuccess("Payment confirmed")
      setTimeout(() => {
        router.push("/payment")
      }, 1500)
    } catch (e) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pending Payment Orders</h1>
        <Link href="/payment" className={styles.backLink}>
          Back to Payments
        </Link>
      </div>

      <div className={styles.header}>
        {success && <div className={styles.success}>{success}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </div>

      {pendingOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No pending payment orders found</h3>
          <p>All orders have been processed or paid.</p>
        </div>
      ) : (
        <div className={styles.ordersGrid}>
          {pendingOrders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={confirmPayment} payment={true}/>
          ))}
        </div>
      )}
    </div>
  );
}