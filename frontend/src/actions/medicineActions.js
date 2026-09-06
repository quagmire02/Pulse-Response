"use server";
import {
  getMedicines,
  getMedicine,
  getMedicineSuggestions,
  getMedicineAlternatives,
  createMedicine,
  updateMedicine,
  requestMedicineRestock,
  deleteMedicine,
} from "@/libs/api";

export const actionError = async (response) => {
  if (typeof response.error === "object") {
    const errorMessages = {};

    for (const key in response.error) {
      if (key.startsWith("category_ids.")) {
        if (!errorMessages.categories) {
          errorMessages.categories = [];
        }
        errorMessages.categories.push(...response.error[key]);
      }
    }

    if (response.error.name) {
      errorMessages["name"] = response.error.name;
    }

    if (response.error.generic_name) {
      errorMessages["generic_name"] = response.error.generic_name;
    }

    if (response.error.description) {
      errorMessages["description"] = response.error.description;
    }

    if (response.error.price) {
      errorMessages["price"] = response.error.price;
    }

    if (response.error.brand) {
      errorMessages["brand"] = response.error.brand;
    }
    if (response.error.dosage) {
      errorMessages["dosage"] = response.error.dosage;
    }

    if (response.error.stock) {
      errorMessages["stock"] = response.error.stock;
    }

    if (response.error.image_url) {
      errorMessages["image"] = response.error.image_url;
    }

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const getMedicinesAction = async (queryParams = {}) => {
  try {
    const response = await getMedicines(queryParams);

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

export const getMedicineAction = async (id) => {
  try {
    const response = await getMedicine(id);
    console.log(response);
    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const getMedicineSuggestionsAction = async (term, limit = 8) => {
  if (!term || term.trim() === "") {
    return { data: [] };
  }

  try {
    const response = await getMedicineSuggestions({ q: term.trim(), limit });

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data || [] };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

/**
 * Recommend in-stock medicines that share the chemical (generic) name of what the
 * shopper looked for — e.g. an out-of-stock Napa suggests other Paracetamol brands.
 * Pass either a medicine id or the raw search term.
 */
export const getMedicineAlternativesAction = async ({ medicineId, name, limit = 8 } = {}) => {
  try {
    const queryParams = { limit };
    if (medicineId) queryParams.medicine_id = medicineId;
    if (name) queryParams.name = name;

    const response = await getMedicineAlternatives(queryParams);

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: response.data || [],
      genericNames: response.generic_names || [],
      matchedBy: response.matched_by || "none",
      // What the shopper actually searched for. Needed because the in-stock
      // filter hides the sold out item from the grid entirely.
      requested: response.requested || [],
    };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const createMedicineAction = async (formData) => {
  try {
    const response = await createMedicine(formData);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const updateMedicineAction = async (id, formData) => {
  try {
    let data, response;
    let image_url = formData.get("image_url")
    
    if (image_url.size > 0) {
      response = await updateMedicine(id, formData, true);
    } else {
      const category_ids = formData.getAll("category_ids[]");

      data = {
        ...(category_ids.length > 0 && { category_ids }),
        ...(formData.get("name") && { name: formData.get("name") }),
        ...(formData.get("generic_name") && { generic_name: formData.get("generic_name") }),
        ...(formData.get("description") && { description: formData.get("description") }),
        ...(formData.get("price") && { price: formData.get("price") }),
        ...(formData.get("stock") && { stock: formData.get("stock") }),
        ...(formData.get("brand") && { brand: formData.get("brand") }),
        ...(formData.get("dosage") && { dosage: formData.get("dosage") }),
      };

      response = await updateMedicine(id, data);
    }

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const deleteMedicineAction = async (id) => {
  try {
    const response = await deleteMedicine(id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: "Medicine deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

/**
 * Last step of the out of stock fallback: no alternative could be recommended,
 * so hand the demand to the pharmacy team instead of ending on a dead end.
 */
export const requestMedicineRestockAction = async (id) => {
  try {
    const response = await requestMedicineRestock(id);

    if (response.error) {
      return { error: typeof response.error === "string" ? response.error : "Could not send the request." };
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Could not send the request." };
  }
};
