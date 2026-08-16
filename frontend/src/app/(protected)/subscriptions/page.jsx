"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSubscriptionsAction } from "@/actions/subscriptionActions";
import Pagination from "@/components/paginations/Pagination";
import styles from "./page.module.css";

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: searchParams.get("page") || "1",
  });

  const loadSubscriptions = async (currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams.append(key, value);
        }
      });

      const result = await getSubscriptionsAction(Object.fromEntries(queryParams));

      if (result.error) {
        setError(result.error);
      } else {
        setSubscriptions(result.data || []);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError("Failed to load subscriptions");
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

    const newUrl = `/subscriptions?${queryParams.toString()}`;
    router.push(newUrl);
  };

  useEffect(() => {
    loadSubscriptions();
  }, [filters]);

  const formatDate = (dateString) => {
    if (!dateString) return "Calculating...";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>My Medicine Subscriptions</h1>
        <p className={styles.subtitle}>
          Manage your automatic medicine deliveries, billing, and discounts
        </p>
      </div>

      {error && (
        <div className={styles.error}>
          {typeof error === "object" ? JSON.stringify(error) : error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading subscriptions...</div>
      ) : (
        <>
          {subscriptions.length > 0 ? (
            <div className={styles.subscriptionList}>
              {subscriptions.map((sub) => (
                <div key={sub.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.frequencyBadge}>
                      <span className={styles.refreshIcon}>🔄</span>
                      <span className={styles.frequencyText}>
                        {sub.subscribe_type} Subscription
                      </span>
                    </div>
                    <div className={styles.nextDelivery}>
                      <span className={styles.deliveryLabel}>Next Delivery:</span>
                      <span className={styles.deliveryDate}>
                        {formatDate(sub.next_delivery_date)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Medicines Reserved</h3>
                      <div className={styles.medicinesList}>
                        {/* Only medicines renew on a subscription; equipment lines are one-off. */}
                        {sub.order_items
                          .filter((item) => item.medicine)
                          .map((item) => (
                            <div key={item.id} className={styles.medicineItem}>
                              <div className={styles.medicineInfo}>
                                <span className={styles.medicineName}>
                                  {item.medicine.name}
                                </span>
                                <span className={styles.medicineQty}>
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <span className={styles.medicinePrice}>
                                ${(item.medicine.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Subscription Details</h3>
                      <div className={styles.detailsGrid}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Original Order:</span>
                          <Link href={`/orders/${sub.id}`} className={styles.orderLink}>
                            Order #{sub.id}
                          </Link>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Delivery Method:</span>
                          <span className={styles.detailValue}>
                            {sub.delivery?.delivery_type} delivery
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Discount Saved:</span>
                          <span className={styles.discountValue}>
                            -${Number(sub.discount_amount).toFixed(2)} (
                            {sub.subscribe_type === "weekly" ? "5%" : "10%"})
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Billing Amount:</span>
                          <span className={styles.totalValue}>
                            ${Number(sub.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {sub.renewal_orders && sub.renewal_orders.length > 0 && (
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Renewal History</h3>
                        <div className={styles.renewalHistory}>
                          {sub.renewal_orders.map((renewal) => (
                            <div key={renewal.id} className={styles.renewalItem}>
                              <div className={styles.renewalMain}>
                                <Link
                                  href={`/orders/${renewal.id}`}
                                  className={styles.renewalLink}
                                >
                                  Order #{renewal.id}
                                </Link>
                                <span className={styles.renewalDate}>
                                  {formatDate(renewal.order_date)}
                                </span>
                              </div>
                              <span
                                className={`${styles.statusBadge} ${
                                  renewal.order_status === "delivered"
                                    ? styles.statusDelivered
                                    : renewal.order_status === "canceled"
                                    ? styles.statusCanceled
                                    : styles.statusPending
                                }`}
                              >
                                {renewal.order_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <button
                      onClick={() => router.push(`/orders/${sub.id}`)}
                      className={styles.manageButton}
                    >
                      Configure Subscription Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <h3>No Active Subscriptions</h3>
              <p>You don't have any active medicine subscriptions at the moment.</p>
              <p className={styles.actionPrompt}>
                Choose a Weekly or Monthly plan when checking out to enable automatic deliveries!
              </p>
              <button
                className={styles.shopButton}
                onClick={() => router.push("/medicines")}
              >
                Browse Medicines
              </button>
            </div>
          )}

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

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading subscriptions...</div>}>
      <SubscriptionsContent />
    </Suspense>
  );
}
