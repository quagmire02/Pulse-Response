"use server";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "@/libs/api";
import { deleteSessionCookie, getUserIdFromSession } from "@/libs/cookie";

/**
 * Map backend validation errors onto the profile form's fields.
 *
 * Anything the form has no field for used to be dropped, so a 401, a 403 or a
 * rule the whitelist did not know about produced an empty object. The form then
 * rendered nothing and the page silently reverted, which looked like the save
 * had simply not happened.
 */
export const actionError = async (response) => {
  if (typeof response.error === "object" && response.error !== null) {
    const known = ["email", "username", "first_name", "last_name", "address", "password"];
    const errorMessages = {};
    const leftovers = [];

    Object.entries(response.error).forEach(([key, value]) => {
      if (known.includes(key)) {
        errorMessages[key] = value;
      } else {
        leftovers.push(Array.isArray(value) ? value.join(" ") : String(value));
      }
    });

    // Never return an empty error object: something went wrong, so say so.
    if (leftovers.length > 0 || Object.keys(errorMessages).length === 0) {
      errorMessages.general = leftovers.join(" ") || "The update could not be saved.";
    }

    return { error: errorMessages };
  }

  return { error: { general: response.error || "The update could not be saved." } };
};

export const getUsersAction = async (queryParams = {}) => {
  try {
    const response = await getUsers(queryParams);

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

export const getUserAction = async (id) => {
  try {
    const response = await getUser(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch user." };
  }
};

export const createUserAction = async (formData) => {
  const email = formData.get("email");
  const username = formData.get("username");
  const first_name = formData.get("first_name");
  const last_name = formData.get("last_name");
  const address = formData.get("address");
  const password = formData.get("password");
  const password_confirmation = formData.get("password_confirmation");

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
    password,
    password_confirmation,
  };

  try {
    const response = await createUser(data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to create user." };
  }
};

export const updateUserAction = async (id, formData) => {
  const email = formData.get("email");
  const username = formData.get("username");
  const first_name = formData.get("first_name");
  const last_name = formData.get("last_name");
  const address = formData.get("address");
  const password = formData.get("password");
  const password_confirmation = formData.get("password_confirmation");

  const data = {
    email,
    ...(username && { username }),
    ...(first_name && { first_name }),
    ...(last_name && { last_name }),
    ...(address && { address }),
    ...(password && { password }),
    ...(password_confirmation && { password_confirmation }),
  };

  try {
    const response = await updateUser(id, data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to update user." };
  }
};

export const deleteUserAction = async (id) => {
  try {
    const response = await deleteUser(id);

    if (response.error) {
      return { error: response.error };
    }

    try {
      const loggedInId = await getUserIdFromSession();
      if (Number(loggedInId) === Number(id)) {
        await deleteSessionCookie();
      }
    } catch (e) {
      console.error("Error clearing session:", e);
    }

    return { success: "User deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to delete user." };
  }
};
