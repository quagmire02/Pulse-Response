"use server";
import {
  getEquipmentFulfillments,
  updateEquipmentFulfillment,
  updateEquipmentHandover,
} from "@/libs/api";

export const getEquipmentFulfillmentsAction = async (queryParams = {}) => {
  try {
    const response = await getEquipmentFulfillments(queryParams);

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: response.data,
      pagination: {
        count: response.total,
        total_pages: Math.ceil(response.total / response.per_page),
      },
    };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch handover requests." };
  }
};

/**
 * Vendor side: confirm the request, pin a handover time, or close it out.
 */
export const updateEquipmentFulfillmentAction = async (id, data) => {
  try {
    const response = await updateEquipmentFulfillment(id, data);

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success, data: response.data };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to update the handover request." };
  }
};

/**
 * Customer side: change where they want the handover and leave a note.
 */
export const updateEquipmentHandoverAction = async (id, data) => {
  try {
    const response = await updateEquipmentHandover(id, data);

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success, data: response.data };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to update handover details." };
  }
};
