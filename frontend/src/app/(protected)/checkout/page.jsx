"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createOrderAction } from "@/actions/orderActions"
import { payOrderWithCardAction } from "@/actions/paymentActions"
import { toastSuccess, toastError } from "@/libs/toast"
import { getCartItemsAction } from "@/actions/cartActions"
import { getUserIdAction } from "@/actions/authActions"
import { getMembershipAction } from "@/actions/membershipActions"
import { calculateOrderTotals, DELIVERY_LABELS, DELIVERY_CHARGES } from "@/libs/pricing"
import { useFormStatus } from "react-dom"
import styles from "./page.module.css"

const TEST_PAYMENT_METHODS = [
  { value: "pm_card_visa", label: "Visa ending 4242, succeeds" },
  { value: "pm_card_mastercard", label: "Mastercard ending 4444, succeeds" },
  { value: "pm_card_chargeDeclined", label: "Declined card, to test a failure" },
  { value: "pm_card_chargeDeclinedInsufficientFunds", label: "Insufficient funds" },
]

function PaymentForm({ paymentMethod, setPaymentMethod, loading }) {
  return (
    <div className={styles.cardPaymentForm}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="stripe_payment_method">
          Card
        </label>
        <select
          id="stripe_payment_method"
          className={styles.input}
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
        >
          {TEST_PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.cardNotice}>
        Payments run against Stripe in test mode. The card is held by Stripe and
        charged through their API, so declines and receipts are real responses,
        but no money moves and no card details are stored here.
      </p>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Processing..." : "Pay and Complete Order"}
        </button>
      </div>
    </div>
  );
}

function FormContent({
  cartItems,
  success,
  error,
  subscribeType,
  setSubscribeType,
  deliveryType,
  setDeliveryType,
  paymentMethod,
  isPremium,
}) {
  const { pending } = useFormStatus();
  const [prescriptionImages, setPrescriptionImages] = useState([{ id: Date.now(), file: null }]);

  const hasEquipment = cartItems.some((item) => item.item_type !== "medicine");
  const hasMedicines = cartItems.some((item) => item.item_type === "medicine");

  const handleAddImage = () => {
    setPrescriptionImages([...prescriptionImages, { id: Date.now(), file: null }]);
  };

  const handleRemoveImage = (id) => {
    if (prescriptionImages.length > 1) {
      setPrescriptionImages(prescriptionImages.filter(img => img.id !== id));
    }
  };

  const handleFileChange = (e, id) => {
    const file = e.target.files[0];
    const newImages = prescriptionImages.map(img => {
      if (img.id === id) {
        return { ...img, file: file };
      }
      return img;
    });
    setPrescriptionImages(newImages);
  };

  const handleDeliveryChange = (e) => {
    setDeliveryType(e.target.value);
  };

  const totals = calculateOrderTotals({
    cartItems,
    deliveryType,
    paymentMethod,
    isPremium,
  });

  const getNextDeliveryDateString = () => {
    const date = new Date();
    if (subscribeType === "weekly") {
      date.setDate(date.getDate() + 7);
    } else if (subscribeType === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else {
      return null;
    }
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const nextDeliveryDateStr = getNextDeliveryDateString();

  return (
    <>
      <div className={styles.orderSummary}>
        <h2 className={styles.sectionTitle}>Order Summary</h2>
        <div className={styles.items}>
          {cartItems.map((item) => {
            const product = item.item_type === "medicine" ? item.medicine : item.equipment;
            const suffix =
              item.item_type === "equipment_rental"
                ? ` (rental ${item.rental_start} to ${item.rental_end})`
                : item.item_type === "equipment_purchase"
                ? " (purchase)"
                : "";

            return (
              <div key={item.id} className={styles.item}>
                <span className={styles.itemName}>{(product?.name || "Item") + suffix}</span>
                <span className={styles.itemQuantity}>x{item.quantity}</span>
                <span className={styles.itemPrice}>${Number(item.line_total ?? 0).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.items}>
          <div className={styles.item}>
            <span className={styles.itemName}>Subtotal</span>
            <span className={styles.itemPrice}>${totals.subtotal.toFixed(2)}</span>
          </div>

          {totals.premiumDiscount > 0 && (
            <div className={styles.item}>
              <span className={styles.itemName} style={{ color: "#2e7d32", fontWeight: "600" }}>
                Premium card discount (10%)
              </span>
              <span className={styles.itemPrice} style={{ color: "#2e7d32", fontWeight: "600" }}>
                -${totals.premiumDiscount.toFixed(2)}
              </span>
            </div>
          )}

          <div className={styles.item}>
            <span className={styles.itemName}>
              Delivery charge, {DELIVERY_LABELS[deliveryType] || deliveryType}
            </span>
            <span className={styles.itemPrice}>${totals.delivery.toFixed(2)}</span>
          </div>
        </div>
        <div className={styles.total}>
          <strong>Total: ${totals.total.toFixed(2)}</strong>
        </div>

        {isPremium && paymentMethod !== "card" && (
          <p className={styles.premiumHint}>
            You have premium access. Choose card payment below to take 10% off this order.
          </p>
        )}
        {nextDeliveryDateStr && (
          <div className={styles.deliveryNotice} style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "6px",
            fontSize: "0.9rem",
            borderLeft: "4px solid #2e7d32"
          }}>
            <strong>Subscription active.</strong> Your next automatic delivery is scheduled for{" "}
            <strong>{nextDeliveryDateStr}</strong>, and every renewal from then on gets{" "}
            <strong>10% off the medicines</strong>. You can edit the items or unsubscribe from the
            Subscriptions page, up to 7 days before a delivery.
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Delivery &amp; Handover Details</h2>
        {hasEquipment && (
          <p className={styles.helpText}>
            Your vendor uses this address and phone number to arrange the equipment handover.
            They will confirm a time and place, which you can track from the order page.
          </p>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="delivery_address" className={styles.label}>Delivery / Handover Address *</label>
          <input
            type="text"
            id="delivery_address"
            name="delivery_address"
            className={styles.input}
            placeholder="House, road, area, city"
            required
            disabled={pending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contact_phone" className={styles.label}>Contact Phone *</label>
          <input
            type="text"
            id="contact_phone"
            name="contact_phone"
            className={styles.input}
            placeholder="Number the courier or vendor can reach you on"
            required
            disabled={pending}
          />
        </div>

        {hasEquipment && (
          <div className={styles.formGroup}>
            <label htmlFor="preferred_handover_date" className={styles.label}>Preferred Handover Date</label>
            <input
              type="date"
              id="preferred_handover_date"
              name="preferred_handover_date"
              className={styles.input}
              min={new Date().toISOString().split("T")[0]}
              disabled={pending}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="delivery_notes" className={styles.label}>Notes for the courier or vendor</label>
          <textarea
            id="delivery_notes"
            name="delivery_notes"
            className={styles.input}
            rows={2}
            placeholder="Landmark, gate code, best time to call"
            disabled={pending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="delivery_type" className={styles.label}>Delivery Type</label>
          <select
            id="delivery_type"
            name="delivery_type"
            className={styles.select}
            disabled={pending}
            value={deliveryType}
            onChange={handleDeliveryChange}
          >

            <option value="basic">Basic, 2 to 3 days, ${DELIVERY_CHARGES.basic.toFixed(2)}</option>
            <option value="rapid">Rapid, next day, ${DELIVERY_CHARGES.rapid.toFixed(2)}</option>
            <option value="emergency">Emergency, within hours, ${DELIVERY_CHARGES.emergency.toFixed(2)}</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subscribe_type" className={styles.label}>Subscription</label>
          <select
            id="subscribe_type"
            name="subscribe_type"
            className={styles.select}
            disabled={pending}
            value={subscribeType}
            onChange={(e) => setSubscribeType(e.target.value)}
          >
            <option value="">Select Subscription</option>
            <option value="none">No Subscription</option>
            <option value="weekly">Weekly (10% off every renewal)</option>
            <option value="monthly">Monthly (10% off every renewal)</option>
          </select>
        </div>
        {hasMedicines && (
        <div className={styles.formGroup}>
          <label className={styles.label}>Prescription Images</label>
          {prescriptionImages.map((input, index) => (
            <div key={input.id} className={styles.dynamicField}>
              <div className={styles.fileUpload}>
                <label htmlFor={`image-${input.id}`} className={styles.fileButton}>Choose File</label>
                <span className={styles.fileName}>{input.file ? input.file.name : 'No file chosen'}</span>
                <input
                  type="file"
                  id={`image-${input.id}`}
                  name="prescription_images[]"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, input.id)}
                  className={styles.hiddenInput}
                  disabled={pending}
                />
              </div>
              {prescriptionImages.length > 1 && (
                <button type="button" onClick={() => handleRemoveImage(input.id)} className={styles.removeButton} disabled={pending}>-</button>
              )}
              {index === prescriptionImages.length - 1 && (
                <button type="button" onClick={handleAddImage} className={styles.addButton} disabled={pending}>+</button>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </>
  );
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotals, setCartTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [deliveryType, setDeliveryType] = useState("basic");

  const [isPremium, setIsPremium] = useState(false);

  const [stripePaymentMethod, setStripePaymentMethod] = useState("pm_card_visa");
  const [subscribeType, setSubscribeType] = useState("none");
  const router = useRouter();

  useEffect(() => {
    setSuccess("");
    setError("");
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const userId = await getUserIdAction();
      if (!userId) {
        router.push("/login");
        return;
      }
      const result = await getCartItemsAction(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setCartItems(result.data.cart_items || []);
        setCartTotals(result.data.totals || null);
      }

      const membership = await getMembershipAction();
      if (!membership.error) {
        setIsPremium(Boolean(membership.data?.is_premium));
      }
    } catch (err) {
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (formData) => {
    setLoading(true);
    setError("");

    const subscribeType = formData.get("subscribe_type");
    const deliveryType = formData.get("delivery_type");
    const deliveryAddress = formData.get("delivery_address");
    const contactPhone = formData.get("contact_phone");
    const prescriptionImages = formData.getAll("prescription_images[]");

    if (!subscribeType) {
      setError("Please select a subscription plan.");
      setLoading(false);
      return;
    }
    if (!deliveryType) {
      setError("Please select a delivery system.");
      setLoading(false);
      return;
    }
    if (!deliveryAddress || !contactPhone) {
      setError("Please provide a delivery address and contact phone number.");
      setLoading(false);
      return;
    }

    formData.append("payment_method", selectedPaymentMethod);

    formData.delete("prescription_images[]");

    prescriptionImages.forEach((file) => {
      if (file instanceof File && file.size > 0) {
        formData.append("prescription_images[]", file);
      } else {
        console.log("File is empty or not a File object.");
      }
    });

    try {
      const orderResult = await createOrderAction(formData);
      if (orderResult.error) {
        const reason =
          typeof orderResult.error === "string"
            ? orderResult.error
            : Object.values(orderResult.error || {}).flat().join(" ");

        setError(reason || "Failed to place the order. Please review the form and try again.");
        setLoading(false);
        return;
      }

      if (selectedPaymentMethod === "card") {
        const paymentResult = await payOrderWithCardAction(
          orderResult?.order_id,
          stripePaymentMethod
        );

        if (paymentResult.error) {
          setError(paymentResult.error);
          toastError(paymentResult.error);
          setLoading(false);
          return;
        }

        setSuccess("Payment successful. Your order is confirmed.");
        toastSuccess("Payment successful. Your order is confirmed.");
      } else {
        setSuccess("Order placed. Pay the rider on delivery.");
        toastSuccess("Order placed. Pay the rider on delivery.");

      }
      setTimeout(() => {
        router.push("/orders");
      }, 1500);

    } catch (err) {
      setError("Failed to process order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading checkout...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <button className={styles.shopButton} onClick={() => router.push("/medicines")}>
            Browse Medicines
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Checkout</h1>
      </div>

      <form action={handleOrder} id="checkout-form">
        <FormContent
          cartItems={cartItems}
          success={success}
          error={error}
          subscribeType={subscribeType}
          setSubscribeType={setSubscribeType}
          deliveryType={deliveryType}
          setDeliveryType={setDeliveryType}
          paymentMethod={selectedPaymentMethod}
          isPremium={isPremium}
        />
        <div className={styles.paymentMethods}>
          <h2 className={styles.sectionTitle}>Payment Method</h2>
          <div className={styles.methodButtons}>
            <button
              type="button"
              className={styles.methodButton}
              onClick={() => setSelectedPaymentMethod("card")}
            >
              <div className={styles.methodIcon}>💳</div>
              <div className={styles.methodText}>
                <h3>Card Payment</h3>
                <p>Pay with credit or debit card</p>
              </div>
            </button>
            <button
              type="button"
              className={styles.methodButton}
              onClick={() => setSelectedPaymentMethod("cash")}
            >
              <div className={styles.methodIcon}>💵</div>
              <div className={styles.methodText}>
                <h3>Cash Payment</h3>
                <p>Pay when you receive your order</p>
              </div>
            </button>
          </div>
        </div>

        {selectedPaymentMethod === "cash" && (
          <>
            <p className={styles.cashNotice}>
              Pay the delivery rider in cash when your order arrives. It is marked
              paid automatically once the delivery is completed, and you will get a
              notification then. There is nothing to confirm afterwards.
            </p>
            <button className={styles.submitButton} type="submit" disabled={loading}>
              {loading ? "Processing..." : "Place Cash Order"}
            </button>
          </>
        )}

        {selectedPaymentMethod === "card" && (
          <PaymentForm
            paymentMethod={stripePaymentMethod}
            setPaymentMethod={setStripePaymentMethod}
            loading={loading}
          />
        )}

        <button type="submit" style={{ display: 'none' }} id="hidden-submit" />
      </form>

      <br></br>

      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}

    </div>
  )
}