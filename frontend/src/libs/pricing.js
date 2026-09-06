export const DELIVERY_CHARGES = {
  basic: 10.0,
  rapid: 20.0,
  emergency: 35.0,
};

export const DELIVERY_LABELS = {
  basic: "Basic, 2 to 3 days",
  rapid: "Rapid, next day",
  emergency: "Emergency, within hours",
};

export const PREMIUM_CARD_DISCOUNT_RATE = 0.1;

export const deliveryCharge = (type) =>
  DELIVERY_CHARGES[type] ?? DELIVERY_CHARGES.basic;

export function calculateOrderTotals({
  cartItems = [],
  deliveryType = "basic",
  paymentMethod = "cash",
  isPremium = false,
}) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.line_total ?? 0),
    0
  );

  const subscriptionDiscount = 0;

  const premiumDiscount =
    paymentMethod === "card" && isPremium
      ? (subtotal - subscriptionDiscount) * PREMIUM_CARD_DISCOUNT_RATE
      : 0;

  const delivery = deliveryCharge(deliveryType);

  const total = subtotal - subscriptionDiscount - premiumDiscount + delivery;

  return {
    subtotal: round(subtotal),
    subscriptionDiscount: round(subscriptionDiscount),
    premiumDiscount: round(premiumDiscount),
    delivery: round(delivery),
    total: round(total),
  };
}

const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
