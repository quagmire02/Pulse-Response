"use server";
import { getVendors, getVendor, createVendor, updateVendor } from "@/libs/api";

const actionError = (response) => {
  if (typeof response.error === "object") {
    const map = {
      company_name: "company_name",
      license_num: "license_num",
      description: "description",
      contact_phone: "contact_phone",
      email: "email",
      username: "username",
      password: "password",
    };
    const errorMessages = {};
    Object.entries(map).forEach(([key, label]) => {
      if (response.error[key]) errorMessages[label] = response.error[key];
    });
    return { error: errorMessages };
  }
  return { error: { error: response.error } };
};

export const getVendorsAction = async (queryParams = {}) => {
  try {
    const response = await getVendors(queryParams);
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
    return { error: error.message || "Failed to fetch vendors." };
  }
};

export const getVendorAction = async (userId) => {
  try {
    const response = await getVendor(userId);
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to fetch vendor." };
  }
};

export const createVendorAction = async (formData) => {
  const data = {
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    password_confirmation: formData.get("password_confirmation"),
    company_name: formData.get("company_name"),
    license_num: formData.get("license_num"),
  };

  const optionals = ["first_name", "last_name", "address", "description", "contact_phone"];
  optionals.forEach((key) => {
    const val = formData.get(key);
    if (val) data[key] = val;
  });

  const errors = {};
  if (!data.email) errors.email = "Email is required.";
  if (!data.password) errors.password = "Password is required.";
  if (data.password !== data.password_confirmation)
    errors.password_confirmation = "Passwords do not match.";
  if (!data.company_name) errors.company_name = "Company name is required.";
  if (!data.license_num) errors.license_num = "License number is required.";
  if (Object.keys(errors).length > 0) return { error: errors };

  try {
    const response = await createVendor(data);
    if (response.error) return actionError(response);
    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Failed to create vendor." };
  }
};

export const updateVendorAction = async (userId, formData) => {
  const data = {};
  const fields = [
    "email", "username", "first_name", "last_name", "address",
    "password", "password_confirmation", "company_name",
    "license_num", "description", "contact_phone",
  ];
  fields.forEach((key) => {
    const val = formData.get(key);
    if (val) data[key] = val;
  });

  try {
    const response = await updateVendor(userId, data);
    if (response.error) return actionError(response);
    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Failed to update vendor." };
  }
};
