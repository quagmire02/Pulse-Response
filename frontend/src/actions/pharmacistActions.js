"use server";
import {
  getPharmacists,
  getPharmacist,
  createPharmacist,
  updatePharmacist
} from "@/libs/api";
import { deleteSessionCookie } from "@/libs/cookie";

export const actionError = async (response) => {
  if (typeof response.error === "object") {
    const errorMessages = {};

    if (response.error.email) {
      errorMessages["email"] = response.error.email;
    }

    if (response.error.username) {
      errorMessages["username"] = response.error.username;
    }

    if (response.error.first_name) {
      errorMessages["first_name"] = response.error.first_name;
    }

    if (response.error.last_name) {
      errorMessages["last_name"] = response.error.last_name;
    }

    if (response.error.address) {
      errorMessages["address"] = response.error.address;
    }

    if (response.error.license_num) {
      errorMessages["license_num"] = response.error.license_num;
    }

    if (response.error.speciality) {
      errorMessages["speciality"] = response.error.speciality;
    }

    if (response.error.bio) {
      errorMessages["bio"] = response.error.bio;
    }

    if (response.error.is_consultation) {
      errorMessages["is_consultation"] = response.error.is_consultation;
    }

    if (response.error.password) {
      errorMessages["password"] = response.error.password;
    }

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const getPharmacistsAction = async (queryParams = {}) => {
  try {
    const response = await getPharmacists(queryParams);

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
    return { error: error.message || "Failed to fetch users." };
  }
};

export const getPharmacistAction = async (id) => {
  try {
    const response = await getPharmacist(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch user." };
  }
};

export const createPharmacistAction = async (formData) => {
  const email = formData.get("email");
  const username = formData.get("username");
  const first_name = formData.get("first_name");
  const last_name = formData.get("last_name");
  const address = formData.get("address");
  const password = formData.get("password");
  const password_confirmation = formData.get("password_confirmation");
  const license_num = formData.get("license_num");
  const speciality = formData.get("speciality");
  const bio = formData.get("bio");
  const is_consultation = formData.get("is_consultation");
  console.log("is_consultation", is_consultation);

  const errors = {};

  if (!email) {
    errors.email = "Email is required.";
  } else if (!email.includes("@")) {
    errors.email = "Invalid email format.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  if (!password_confirmation) {
    errors.password_confirmation = "Password confirmation is required.";
  }

  if (password !== password_confirmation) {
    errors.password_confirmation = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return { error: errors };
  }

  const data = {
    email,
    ...(username && { username }),
    ...(first_name && { first_name }),
    ...(last_name && { last_name }),
    ...(address && { address }),
    ...(license_num && { license_num }),
    ...(speciality && { speciality }),
    ...(bio && { bio }),
    ...(is_consultation && { is_consultation }),
    password,
    password_confirmation,
  };

  try {
    const response = await createPharmacist(data);
    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to create user." };
  }
};

export const updatePharmacistAction = async (id, formData) => {
  const email = formData.get("email");
  const username = formData.get("username");
  const first_name = formData.get("first_name");
  const last_name = formData.get("last_name");
  const address = formData.get("address");
  const password = formData.get("password");
  const password_confirmation = formData.get("password_confirmation");
  const license_num = formData.get("license_num");
  const speciality = formData.get("speciality");
  const bio = formData.get("bio");
  const is_consultation = formData.get("is_consultation");

  const data = {
    email,
    ...(username && { username }),
    ...(first_name && { first_name }),
    ...(last_name && { last_name }),
    ...(address && { address }),
    ...(license_num && { license_num }),
    ...(speciality && { speciality }),
    ...(bio && { bio }),
    ...(is_consultation && { is_consultation }),
    ...(password && { password }),
    ...(password_confirmation && { password_confirmation }),
  };

  try {
    const response = await updatePharmacist(id, data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to update user." };
  }
};
