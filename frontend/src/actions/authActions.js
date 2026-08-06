"use server";

import {
  login,
  logout,
} from "@/libs/api";
import {
  getUserIdFromSession,
  getUserRoleFromSession,
  deleteSessionCookie,
  setSessionCookie,
} from "@/libs/cookie";
import { redirect } from "next/navigation";

export const getUserIdAction = async () => {
  try {
    return await getUserIdFromSession();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getUserRoleAction = async () => {
  try {
    return await getUserRoleFromSession();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export async function loginAction(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const credentials = {
    email: email,
    password: password,
  };

  try {
    // Make the login request to the backend API
    const response = await login(credentials);

    if (
      response.token &&
      response.user_role &&
      response.user_id &&
      response.token_expiry
    ) {
      await setSessionCookie(response);
      // Return success response if login is successful
      return { success: "Logged in successfully" };
    } else {
      // Return error if login fails
      return response;
    }
  } catch (error) {
    // Handle any network or unexpected error
    console.error(error);
    return { error: error.message || "An error occurred during login." };
  }
}

export const logoutAction = async () => {
  try {
    await logout();
    // Delete the session cookie
    await deleteSessionCookie();
    redirect("/auth/login");
  } catch (error) {
    throw error;
  }
};