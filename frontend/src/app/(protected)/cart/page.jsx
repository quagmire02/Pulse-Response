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
      }
    } catch (err) {
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => {
        const price = Number.parseFloat(item.medicine.price);
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

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
          <p>Add some delicious items to get started!</p>
          <button
            className={styles.shopButton}
            onClick={() => router.push("/medicines")}
          >
            Browse Medicines
          </button>
        </div>
      ) : (
        <>
          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdate={loadCartItems}
              />
            ))}
          </div>

          <div className={styles.summary}>
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
