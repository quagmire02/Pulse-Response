"use server";
import {
  getSlots,
  createSlot,
  deleteSlot,
  getConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getReviews,
  createReview,
  deleteReview,
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

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const getSlotsAction = async (pharmacist_id, queryParams = {}) => {
  try {
    const response = await getSlots(pharmacist_id, queryParams);

    if (response.error) {
      return { error: response.error };
    }

    const slots = response.data ?? response;
    return { data: Array.isArray(slots) ? slots : [] };
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
  const pharmacist_id = formData["pharmacist_id"];
  const date = formData["date"];
  const start_time = formData["start_time"];
  const start_period = formData["start_period"];

  const data = {
    pharmacist_id,
    date,
    start_time,
    start_period,
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

export const createSlotAction = async (formData) => {
  const data = {
    date: formData["date"],
    start_time: parseInt(formData["start_time"]),
  };
  try {
    const response = await createSlot(data);
    if (response.error) return { error: response.error };
    return { success: "Slot created.", data: response };
  } catch (error) {
    return { error: error.message || "Failed to create slot." };
  }
};

export const deleteSlotAction = async (slotId) => {
  try {
    const response = await deleteSlot(slotId);
    if (response.error) return { error: response.error };
    return { success: "Slot deleted." };
  } catch (error) {
    return { error: error.message || "Failed to delete slot." };
  }
};

export const getReviewsAction = async (pharmacistId) => {
  try {
    const response = await getReviews(pharmacistId);
    if (response.error) return { error: response.error };
    return { data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to fetch reviews." };
  }
};

export const createReviewAction = async (pharmacistId, formData) => {
  const data = {
    rating: parseInt(formData["rating"]),
    comment: formData["comment"] || null,
  };
  try {
    const response = await createReview(pharmacistId, data);
    if (response.error) return { error: response.error };
    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Failed to submit review." };
  }
};

export const deleteReviewAction = async (pharmacistId) => {
  try {
    const response = await deleteReview(pharmacistId);
    if (response.error) return { error: response.error };
    return { success: "Review deleted." };
  } catch (error) {
    return { error: error.message || "Failed to delete review." };
  }
};
