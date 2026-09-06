"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOrdersAction } from "@/actions/orderActions";
import { getUserRoleAction } from "@/actions/authActions";
import OrderCard from "@/components/cards/OrderCard";
import Pagination from "@/components/paginations/Pagination";
import styles from "./page.module.css";

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: searchParams.get("page") || "1",
  });

  const loadOrders = async (currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams.append(key, value);
        }
      });

      const result = await getOrdersAction(Object.fromEntries(queryParams));

      if (result.error) {
        setError(result.error);
      } else {
        setOrders(result.data || []);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page: page.toString() };
    setFilters(updatedFilters);

    const queryParams = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        queryParams.append(key, value);
      }
    });

    const newUrl = `/orders?${queryParams.toString()}`;
    router.push(newUrl);
  };

  const handleOrderClick = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const result = await getUserRoleAction();
        if (result.error) {
          setError(result.error);
        } else {
          setRole(result);
        }
      } catch (err) {
        setError("Failed to fetch user role");
      }
    };

    fetchUserRole();
    loadOrders();
  }, [filters]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        {(role === "super_admin" || role === "admin") ? (
          <>
            <h1 className={styles.title}>All Orders</h1>
            <p className={styles.subtitle}>View and manage all orders</p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>My Orders</h1>
            <p className={styles.subtitle}>View and track your order history</p>
          </>
        )
        }
      </div>

      {error && (
        <div className={styles.error}>
          {typeof error === "object" ? JSON.stringify(error) : error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : (
        <>
          <div className={styles.orderGrid}>
            {orders.length > 0 ? (
              orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => handleOrderClick(order.id)}
                />
              ))
            ) : (
              <div className={styles.noResults}>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet.</p>
              </div>
            )}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <Pagination
              currentPage={Number.parseInt(filters.page)}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
