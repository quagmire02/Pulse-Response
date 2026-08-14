"use server";
import {
  getPayments,
  getPayment,
  createPayment,
  deletePayment
} from "@/libs/api";

export const actionError = async (response) => {
  if (typeof response.error === "object") {
    const errorMessages = {};

    if (response.error.order_id) {
      errorMessages["order"] = response.error.order_id;
    }

    if (response.error.payment_type) {
      errorMessages["payment"] = response.error.payment_type;
    }

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const getPaymentsAction = async (queryParams = {}) => {
  try {
    const response = await getPayments(queryParams);

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

export const getPaymentAction = async (id) => {
  try {
    const response = await getPayment(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};

export const createPaymentAction = async (formData) => {
  const order_id = formData.get("order");
  const payment_type = formData.get("payment");

  const data = {
    order_id,
    payment_type,
  };

  try {
    const response = await createPayment(data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};


export const deletePaymentAction = async (id) => {
  try {
    const response = await deletePayment(id);

    if (response.error) {
      return { error: response.error };
    }
    
    await logoutAction()
    return { success: "Payment deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured." };
  }
};
