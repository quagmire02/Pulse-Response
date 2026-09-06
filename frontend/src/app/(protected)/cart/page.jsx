"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCartItemsAction } from "@/actions/cartActions";
import { getUserIdAction } from "@/actions/authActions";
import CartItemCard from "@/components/cards/CartItemCard";
import { CheckoutButton } from "@/components/buttons/buttons";
import { PageShell, Alert, EmptyState, Loading, errorText } from "@/components/layout/PageShell";
import styles from "./page.module.css";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [totals, setTotals] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const userId = await getUserIdAction();
      if (!userId) {
        setError("Please log in to view your cart");
        return;
      }

      const result = await getCartItemsAction(userId);

      if (result.error) {
        setError(result.error);
      } else {
        setCartItems(result.data.cart_items || []);
        setCartId(result.data.cart_id);
        setTotals(result.data.totals || null);
        setSubtotal(Number(result.data.subtotal ?? 0));
      }
    } catch (err) {
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => subtotal.toFixed(2);

  // Only shown when the basket actually mixes categories.
  const breakdown = totals
    ? [
        { label: "Medicines", value: Number(totals.medicines ?? 0) },
        { label: "Equipment purchases", value: Number(totals.equipment_purchases ?? 0) },
        { label: "Equipment rentals", value: Number(totals.equipment_rentals ?? 0) },
      ].filter((row) => row.value > 0)
    : [];

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }
    router.push("/checkout");
  };

  if (loading) {
    return (
      <PageShell title="Shopping Cart" showBack={false}>
        <Loading label="Loading your cart" />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Checkout"
      title="Shopping Cart"
      subtitle={
        cartItems.length > 0
          ? `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}, medicines and equipment together.`
          : undefined
      }
    >
      <Alert kind="error">{errorText(error)}</Alert>

      {cartItems.length === 0 ? (
        <EmptyState>
          <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ marginBottom: 18 }}>Add medicines or medical equipment to get started.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="pr-btn pr-btn-primary" onClick={() => router.push("/medicines")}>
              Browse medicines
            </button>
            <button className="pr-btn pr-btn-ghost" onClick={() => router.push("/equipment")}>
              Browse equipment
            </button>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                cartId={cartId}
                allItems={cartItems}
                onUpdate={loadCartItems}
              />
            ))}
          </div>

          <div className={styles.summary}>
            {breakdown.length > 1 && (
              <div className={styles.breakdown}>
                {breakdown.map((row) => (
                  <div key={row.label} className={styles.breakdownRow}>
                    <span>{row.label}</span>
                    <span>${row.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.total}>
              <span className={styles.totalLabel}>Total: </span>
              <span className={styles.totalAmount}>${calculateTotal()}</span>
            </div>

            <CheckoutButton onClick={handleCheckout} />
          </div>
        </>
      )}
    </PageShell>
  );
}
