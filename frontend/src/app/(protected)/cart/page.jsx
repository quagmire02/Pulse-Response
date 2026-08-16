"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCartItemsAction } from "@/actions/cartActions";
import { getUserIdAction } from "@/actions/authActions";
import CartItemCard from "@/components/cards/CartItemCard";
import { CheckoutButton } from "@/components/buttons/buttons";
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
      <div className={styles.container}>
        <div className={styles.loading}>Loading cart...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Shopping Cart</h1>
        {cartItems.length > 0 && (
          <p className={styles.itemCount}>
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {typeof error === "object" ? JSON.stringify(error) : error}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add medicines or medical equipment to get started.</p>
          <button
            className={styles.shopButton}
            onClick={() => router.push("/medicines")}
          >
            Browse Medicines
          </button>
          <button
            className={styles.shopButton}
            onClick={() => router.push("/equipment")}
          >
            Browse Equipment
          </button>
        </div>
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
    </div>
  );
}
