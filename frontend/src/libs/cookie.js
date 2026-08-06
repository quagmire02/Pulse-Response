import { cookies } from "next/headers";
import {
  encrypt,
  decrypt,
  validateSessionData,
} from "./session";

export const setSessionCookie = async (data) => {
  try {
    // Validate the incoming session data
    const sessionData = validateSessionData(data); // Sanitize and validate data

    if (!sessionData) {
      throw new Error("Invalid session data.");
    }

    // Encrypt the session data
    const encryptedSessionData = await encrypt(sessionData);

    // Create a secure cookie
    // Set the secure cookie using Next.js cookies API
    const cookieStore = await cookies();
    cookieStore.set("session", encryptedSessionData, {
      httpOnly: true,
      secure: false, // Secure in production
      maxAge: 60 * 60 * 24, // One day in seconds
      path: "/", // Dynamic path
      sameSite: "lax", // Helps prevent CSRF attacks
    });

    console.log("Session cookie set:", cookieStore.get("session"));
    return cookieStore.get("session");
  } catch (error) {
    console.error("Error setting cookie:", error);
    throw new Error("Failed to set session cookie.");
  }
};

export const deleteSessionCookie = async () => {
  const cookieStore = await cookies();

  if (cookieStore.has("session")) {
    cookieStore.set("session", "", {
      httpOnly: true,
      secure: false, // Secure in production
      maxAge: 0, // Expire the cookie immediately
      path: "/", // Ensure the cookie is deleted for all paths
      sameSite: "lax",
    });
  }
};

export const getUserIdFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session"); // Retrieve the session cookie

  if (!sessionCookie) {
    return null; // No session cookie found
  }

  if (!sessionCookie.value) {
    return null; // No session cookie value found
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value); // Decrypt the session data
    return decryptedData?.user_id || null; // Return user_id if present
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null; // Return null if decryption fails
  }
};

export const getUserRoleFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session"); // Retrieve the session cookie

  if (!sessionCookie) {
    return null; // No session cookie found
  }

  if (!sessionCookie.value) {
    return null; // No session cookie value found
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value); // Decrypt the session data
    return decryptedData?.user_role || null; // Return user_role if present
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null; // Return null if decryption fails
  }
};

export const getTokenFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session"); // Retrieve the session cookie
  if (!sessionCookie) {
    return null; // No session cookie found
  }

  if (!sessionCookie.value) {
    return null; // No session cookie value found
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value); // Decrypt the session data
    return decryptedData?.token || null; // Return token if present
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null; // Return null if decryption fails
  }
};

export const getTokenExpiryFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session"); // Retrieve the session cookie

  if (!sessionCookie) {
    return null; // No session cookie found
  }

  if (!sessionCookie.value) {
    return null; // No session cookie value found
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value); // Decrypt the session data

    if (decryptedData && decryptedData.token_expiry) {
      // Check if token_expiry is present
      const expiryDate = new Date(decryptedData.token_expiry);
      const currentDate = new Date();

      // Compare the expiry date with the current date
      if (currentDate > expiryDate) {
        console.warn("Session has expired");
        return false;
      } else {
        console.warn("Session is still valid");
        return true;
      }
    }

    return false; // Return token_expiry if present
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null; // Return null if decryption fails
  }
};
