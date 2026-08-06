"use server";
import {
  getCategories,
  getCategory,
  createCategory,
  deleteCategory
} from "@/libs/api";

export const actionError = async (response) => {
  if (typeof response.error === "object") {
    const errorMessages = {};

    if (response.error.name) {
      errorMessages["name"] = response.error.name;
    }

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const getCategoriesAction = async () => {
  try {
    const response = await getCategories();

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: response,
    };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const getCategoryAction = async (id) => {
  try {
    const response = await getCategory(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const createCategoryAction = async (formData) => {
  const name = formData.get("name");

  const data = {
    name,
  };

  try {
    const response = await createCategory(data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};


export const deleteCategoryAction = async (id) => {
  try {
    const response = await deleteCategory(id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: "Category deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};
