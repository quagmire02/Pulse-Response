import { getCartItemsAction, updateCartItemsAction } from "@/actions/cartActions"
import { getUserIdAction } from "@/actions/authActions"

export const MEDICINE = "medicine"
export const EQUIPMENT_PURCHASE = "equipment_purchase"
export const EQUIPMENT_RENTAL = "equipment_rental"

const toPayloadLine = (item) => ({
  item_type: item.item_type || MEDICINE,
  medicine_id: item.medicine_id ?? item.medicine?.id ?? null,
  equipment_id: item.equipment_id ?? item.equipment?.id ?? null,
  quantity: item.quantity,
  rental_start: item.rental_start ?? null,
  rental_end: item.rental_end ?? null,
})

const isSameLine = (a, b) => {
  if (a.item_type !== b.item_type) return false

  if (a.item_type === MEDICINE) {
    return Number(a.medicine_id) === Number(b.medicine_id)
  }

  if (Number(a.equipment_id) !== Number(b.equipment_id)) return false

  if (a.item_type === EQUIPMENT_RENTAL) {
    return a.rental_start === b.rental_start && a.rental_end === b.rental_end
  }

  return true
}

const normaliseDate = (value) => {
  if (!value) return null
  return typeof value === "string" ? value.slice(0, 10) : value
}

export async function addToCart(line) {
  const userId = await getUserIdAction()
  if (!userId) {
    return { error: "Please log in to order." }
  }

  const cartResult = await getCartItemsAction(userId)
  if (cartResult.error) {
    return { error: cartResult.error }
  }

  const cartId = cartResult.data?.cart_id
  if (!cartId) {
    return { error: "Cart not found." }
  }

  const existing = (cartResult.data?.cart_items || []).map(toPayloadLine)

  const incoming = {
    item_type: line.item_type,
    medicine_id: line.medicine_id ?? null,
    equipment_id: line.equipment_id ?? null,
    quantity: line.quantity ?? 1,
    rental_start: normaliseDate(line.rental_start),
    rental_end: normaliseDate(line.rental_end),
  }

  const normalisedExisting = existing.map((item) => ({
    ...item,
    rental_start: normaliseDate(item.rental_start),
    rental_end: normaliseDate(item.rental_end),
  }))

  const matchIndex = normalisedExisting.findIndex((item) => isSameLine(item, incoming))

  const updated =
    matchIndex >= 0
      ? normalisedExisting.map((item, index) =>
          index === matchIndex ? { ...item, quantity: item.quantity + incoming.quantity } : item
        )
      : [...normalisedExisting, incoming]

  const result = await updateCartItemsAction(cartId, updated)
  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}

export async function setCartLineQuantity(cartId, items, targetId, quantity) {
  const updated = items
    .map(toPayloadLine)
    .map((line, index) => (items[index].id === targetId ? { ...line, quantity } : line))

  return updateCartItemsAction(cartId, updated)
}

export async function removeCartLine(cartId, items, targetId) {
  const updated = items.filter((item) => item.id !== targetId).map(toPayloadLine)

  return updateCartItemsAction(cartId, updated)
}
