import { cookies } from "next/headers";
import {
  encrypt,
  decrypt,
  validateSessionData,
} from "./session";

export const setSessionCookie = async (data) => {
  try {
    const sessionData = validateSessionData(data);

    if (!sessionData) {
      throw new Error("Invalid session data.");
    }

    const encryptedSessionData = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set("session", encryptedSessionData, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
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
      secure: false,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  }
};

export const getUserIdFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return null;
  }

  if (!sessionCookie.value) {
    return null;
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value);
    return decryptedData?.user_id || null;
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null;
  }
};

export const getUserRoleFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return null;
  }

  if (!sessionCookie.value) {
    return null;
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value);
    return decryptedData?.user_role || null;
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null;
  }
};

export const getTokenFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return null;
  }

  if (!sessionCookie.value) {
    return null;
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value);
    return decryptedData?.token || null;
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null;
  }
};

export const getTokenExpiryFromSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return null;
  }

  if (!sessionCookie.value) {
    return null;
  }

  try {
    const decryptedData = await decrypt(sessionCookie.value);

    if (decryptedData && decryptedData.token_expiry) {
      const expiryDate = new Date(decryptedData.token_expiry);
      const currentDate = new Date();

      if (currentDate > expiryDate) {
        console.warn("Session has expired");
        return false;
      } else {
        console.warn("Session is still valid");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error decrypting session data:", error);
    return null;
  }
};
