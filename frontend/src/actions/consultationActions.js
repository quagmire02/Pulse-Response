"use server";
import {
  getSlots,
  getConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  deleteConsultation
} from "@/libs/api";

export const actionError = async (response) => {
  if (typeof response.error === "object") {
    const errorMessages = {};

    if (response.error.status) {
      errorMessages["status"] = response.error.status;
    }

    if (response.error.pharmacist_id) {
      errorMessages["pharmacist"] = response.error.pharmacist_id;
    }

    if (response.error.date) {
      errorMessages["date"] = response.error.date;
    }

    if (response.error.start_time) {
      errorMessages["start_time"] = response.error.start_time;
    }

    // Combine messages into a single string with \n between each
    return { error: errorMessages };
  }

  // If it's not an object, return the error as is (string or other type)
  return { error: { error: response.error } };
};

export const getSlotsAction = async (queryParams = {}) => {
  try {
    const response = await getSlots(queryParams);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch slots." };
  }
}

export const getConsultationsAction = async (queryParams = {}) => {
  try {
    const response = await getConsultations(queryParams);

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
    return { error: error.message || "Failed to fetch consultations." };
  }
};

export const getConsultationAction = async (id) => {
  try {
    const response = await getConsultation(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch consultation." };
  }
};

export const createConsultationAction = async (formData) => {
  const pharmacist_id = formData["pharmacist"];
  const date = formData["date"];
  const start_time = formData["start_time"];

  const data = {
    pharmacist_id,
    provider_id,
    date,
    start_time,
  };

  try {
    const response = await createConsultation(data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to create consultation." };
  }
};

export const updateConsultationAction = async (id, formData) => {
  const status = formData["status"];

  const data = {
    ...(status && { status }),
  };

  try {
    const response = await updateConsultation(id, data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to update consultation." };
  }
};

export const deleteConsultationAction = async (id) => {
  try {
    const response = await deleteConsultation(id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: "Consultation deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to delete consultation." };
  }
};
