"use server";
import {
  getDeliveries,
  getDelivery,
  deleteDelivery
} from "@/libs/api";

export const getDeliveriesAction = async (queryParams = {}) => {
  try {
    const response = await getDeliveries(queryParams);

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
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const getDeliveryAction = async (id) => {
  try {
    const response = await getDelivery(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const deleteDeliveryAction = async (id) => {
  try {
    const response = await deleteDelivery(id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: "Delivery deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};
