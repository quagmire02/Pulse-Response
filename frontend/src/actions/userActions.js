"use server";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
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

    // Check for each possible attribute and append its messages
    if (response.error.password) {
      errorMessages["password"] = response.error.password;
    }

    // Combine messages into a single string with \n between each
    return { error: errorMessages };
  }

  // If it's not an object, return the error as is (string or other type)
  return { error: { error: response.error } };
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

    await deleteSessionCookie();

    return { success: "User deleted" };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to delete user." };
  }
};
