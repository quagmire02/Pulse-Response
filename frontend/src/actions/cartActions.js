"use server";
import {
  getCartItems,
  updateCartItems,
  deleteCartItem
} from "@/libs/api";

export const actionError = async (response) => {
  if (typeof response.error === "object" && response.error !== null) {
    const errorMessages = {};

    if (response.error.items) {
      errorMessages.items = response.error.items;
    }

    for (const key in response.error) {
      if (key.startsWith("items.")) {
        const match = key.match(/items\.(\d+)\.(medicine_id|quantity)/);

        if (match) {
          const index = match[1];
          const field = match[2];

          if (!errorMessages.items || typeof errorMessages.items !== 'object') {
            errorMessages.items = {};
          }

          if (!errorMessages.items[index]) {
            errorMessages.items[index] = {};
          }

          errorMessages.items[index][field] = response.error[key];
        }
      }
    }

    if (Object.keys(errorMessages).length > 0) {
      return { error: errorMessages };
    }
  }

  return { error: { error: response.error } };
};

export const getCartItemsAction = async (user_id) => {
  try {
    const response = await getCartItems(user_id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const updateCartItemsAction = async (cart_id, formData) => {
  const data = {
    items: formData
  }

  try {
    const response = await updateCartItems(cart_id, data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const deleteCartItemAction = async (cart_id) => {
  try {
    const response = await deleteCartItem(cart_id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: "Cart item deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};
