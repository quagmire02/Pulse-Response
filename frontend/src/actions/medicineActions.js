"use server";
import {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
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
