"use server";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder
} from "@/libs/api";

export const actionError = async (response) => {
  if (typeof response.error === "object") {
    const errorMessages = {};

    for (const key in response.error) {
      if (key.startsWith("prescription_images.")) {
        if (!errorMessages.prescription_images) {
          errorMessages.prescription_images = [];
        }
        errorMessages.prescription_images.push(...response.error[key]);
      }
    }

    if (response.error.delivery_type) {
      errorMessages["delivery_type"] = response.error.delivery_type;
    }

    if (response.error.subscribe_type) {
      errorMessages["subscribe_type"] = response.error.subscribe_type;
    }

    if (response.error.order_status) {
      errorMessages["order_status"] = response.error.order_status;
    }

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const getOrdersAction = async (queryParams = {}) => {
  try {
    const response = await getOrders(queryParams);

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
    return { error: error.message || "An unexpected Error occured." };
  }
};

export const getNewOrdersAction = async (queryParams = {}) => {
  try {
    const response = await getNewOrders(queryParams);

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
    return { error: error.message || "An unexpected Error occured." };
  }
};

export const getOrderAction = async (id) => {
  try {
    const response = await getOrder(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};

export const createOrderAction = async (formData) => {
  try {
    const response = await createOrder(formData);

    if (response.error) {
      return actionError(response);
    }

    return response;
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};


export const updateOrderAction = async (id, formData) => {
  const order_status = formData.get("order_status");
  const subscribe_type = formData.get("subscribe_type");

  const data = {
    ...(order_status && { order_status }),
    ...(subscribe_type && { subscribe_type }),
  };

  try {
    const response = await updateOrder(id, data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};


export const deleteOrderAction = async (id) => {
  try {
    const response = await deleteOrder(id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: "Order deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};
