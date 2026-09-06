"use server";
import {
  getSubscriptions,
  cancelSubscription,
  updateSubscriptionItems,
} from "@/libs/api";

export const getSubscriptionsAction = async (queryParams = {}) => {
  try {
    const response = await getSubscriptions(queryParams);

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: response.data,
      pagination: {
        count: response.total,
        total_pages: Math.ceil(response.total / response.per_page),
        next: response.next_page_url ? new URL(response.next_page_url).search : null,
        previous: response.prev_page_url ? new URL(response.prev_page_url).search : null,
      },
    };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected error occurred." };
  }
};

export const cancelSubscriptionAction = async (orderId) => {
  try {
    const response = await cancelSubscription(orderId);

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to cancel the subscription." };
  }
};

export const updateSubscriptionItemsAction = async (orderId, items) => {
  try {
    const response = await updateSubscriptionItems(orderId, { items });

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success, data: response.data };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to update the subscription." };
  }
};
