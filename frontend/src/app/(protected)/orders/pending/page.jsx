import { redirect } from "next/navigation"

/**
 * Retired.
 *
 * This page existed so a customer could confirm a cash payment before it had
 * been handed over, which took three pages to do something that should not
 * happen at all. Cash now settles when the delivery is completed, so anyone
 * arriving here from an old link goes to their orders instead.
 */
export default function PendingOrdersPage() {
  redirect("/orders")
}
