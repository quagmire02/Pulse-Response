"use server";
import {
  getMembership,
  subscribeMembership,
  renewMembership,
  cancelMembership,
  getPaymentLedger,
} from "@/libs/api";

export const getMembershipAction = async () => {
  try {
    const response = await getMembership();
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to load membership status." };
  }
};

/**
 * Start a membership with a Stripe payment method token. The card itself never
 * reaches this app.
 */
export const subscribeMembershipAction = async (paymentMethod) => {
  try {
    const response = await subscribeMembership({ payment_method: paymentMethod });
    if (response.error) return { error: response.error };
    return { success: response.success, data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to start the membership." };
  }
};

export const renewMembershipAction = async () => {
  try {
    const response = await renewMembership();
    if (response.error) return { error: response.error };
    return { success: response.success, data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to renew the membership." };
  }
};

export const cancelMembershipAction = async () => {
  try {
    const response = await cancelMembership();
    if (response.error) return { error: response.error };
    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to cancel auto renewal." };
  }
};

export const getPaymentLedgerAction = async (queryParams = {}) => {
  try {
    const response = await getPaymentLedger(queryParams);
    if (response.error) return { error: response.error };
    return {
      data: response.data,
      summary: response.summary,
      pagination: {
        count: response.total,
        total_pages: Math.ceil(response.total / response.per_page),
      },
    };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to load the transaction ledger." };
  }
};
