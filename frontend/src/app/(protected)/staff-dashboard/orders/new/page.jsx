"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getNewOrdersAction } from "@/actions/orderActions";
import OrderCard from "@/components/cards/OrderCard";
import Pagination from "@/components/paginations/Pagination";
import styles from "./page.module.css";

export default function NewOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: searchParams.get("page") || "1",
  });

  const loadNewOrders = async (currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams.append(key, value);
        }
      });

      const result = await getNewOrdersAction(Object.fromEntries(queryParams));

      if (result.error) {
        setError(result.error);
      } else {
        setOrders(result.data || []);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError("Failed to load new orders");
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

    const newUrl = `/staff-dashboard/orders/new?${queryParams.toString()}`;
    router.push(newUrl);
  };

  const handleOrderClick = (orderId) => {
    router.push(`/staff-dashboard/orders/${orderId}`);
  };

  useEffect(() => {
    loadNewOrders();
  }, [filters]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>New Orders</h1>
          <p className={styles.subtitle}>Manage recently placed orders</p>
        </div>

        {error && (
          <div className={styles.error}>
            {typeof error === "object" ? JSON.stringify(error) : error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading new orders...</div>
        ) : (
          <>
            <div className={styles.orderGrid}>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard
                    key={order.order_id}
                    order={order.order}
                    onClick={() => handleOrderClick(order.order_id)}
                  />
                ))
              ) : (
                <div className={styles.noResults}>No new orders found</div>
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
      </main>
    </div>
  );
}
