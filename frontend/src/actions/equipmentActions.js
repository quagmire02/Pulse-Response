"use server";
import {
  getEquipmentList,
  getEquipmentItem,
  getEquipmentSuggestions,
  getVendorEquipment,
  createEquipment,
  updateEquipment,
  requestEquipmentRestock,
  deleteEquipment,
} from "@/libs/api";

const actionError = (response) => {
  if (typeof response.error === "object") {
    const keys = ["name", "category", "price_per_day", "quantity", "condition", "size", "safety_rules", "description", "image"];
    const errorMessages = {};
    keys.forEach((k) => { if (response.error[k]) errorMessages[k] = response.error[k]; });
    return { error: errorMessages };
  }
  return { error: { error: response.error } };
};

export const getEquipmentAction = async (queryParams = {}) => {
  try {
    const response = await getEquipmentList(queryParams);
    if (response.error) return { error: response.error };
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
    return { error: error.message || "Failed to fetch equipment." };
  }
};

export const getEquipmentItemAction = async (id) => {
  try {
    const response = await getEquipmentItem(id);
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to fetch equipment." };
  }
};

export const getEquipmentSuggestionsAction = async (term, limit = 8) => {
  if (!term || term.trim() === "") {
    return { data: [] };
  }

  try {
    const response = await getEquipmentSuggestions({ q: term.trim(), limit });
    if (response.error) return { error: response.error };
    return { data: response.data || [] };
  } catch (error) {
    return { error: error.message || "Failed to fetch equipment suggestions." };
  }
};

export const getVendorEquipmentAction = async (userId, queryParams = {}) => {
  try {
    const response = await getVendorEquipment(userId, queryParams);
    if (response.error) return { error: response.error };
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
    return { error: error.message || "Failed to fetch vendor equipment." };
  }
};

export const createEquipmentAction = async (formData) => {
  const errors = {};
  if (!formData.get("name")) errors.name = "Name is required.";
  if (!formData.get("category")) errors.category = "Category is required.";
  if (!formData.get("price_per_day")) errors.price_per_day = "Price per day is required.";
  if (!formData.get("quantity")) errors.quantity = "Quantity is required.";
  if (!formData.get("condition")) errors.condition = "Condition is required.";
  if (Object.keys(errors).length > 0) return { error: errors };

  try {
    const response = await createEquipment(formData);
    if (response.error) return actionError(response);
    return { success: "Equipment created successfully.", data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to create equipment." };
  }
};

export const updateEquipmentAction = async (id, formData) => {
  try {
    const response = await updateEquipment(id, formData);
    if (response.error) return actionError(response);
    return { success: "Equipment updated successfully.", data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to update equipment." };
  }
};

export const deleteEquipmentAction = async (id) => {
  try {
    const response = await deleteEquipment(id);
    if (response.error) return { error: response.error };
    return { success: "Equipment deleted." };
  } catch (error) {
    return { error: error.message || "Failed to delete equipment." };
  }
};

/**
 * Same fallback as the medicine catalogue, aimed at the vendor who owns the
 * listing rather than the pharmacy team.
 */
export const requestEquipmentRestockAction = async (id) => {
  try {
    const response = await requestEquipmentRestock(id);

    if (response.error) {
      return { error: typeof response.error === "string" ? response.error : "Could not send the request." };
    }

    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Could not send the request." };
  }
};
