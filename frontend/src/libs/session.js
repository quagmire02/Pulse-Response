const ALGORITHM = "AES-GCM";
let SECRET_KEY;

const get_secret_key = async () => {
  if (typeof window !== "undefined") {
    const response = await fetch("/auth-api/auth-secret-key");
    const data = await response.json();
    SECRET_KEY = data.auth_secret_key;
  } else {
    SECRET_KEY = process.env.AUTH_SECRET_KEY;
  }
};

export function validateSessionData(data) {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  if (typeof data.user_id !== "string" && typeof data.user_id !== "number") {
    return null;
  }
  data.user_id = String(data.user_id).trim();

  if (typeof data.user_role !== "string" || data.user_role.trim() === "") {
    return null;
  }
  data.user_role = data.user_role.trim();

  if (
    typeof data.token !== "string" ||
    data.token.trim() === ""
  ) {
    return null;
  }
  data.token = data.token.trim();

  if (
    typeof data.token_expiry !== "string" ||
    data.token_expiry.trim() === ""
  ) {
    return null;
  }
  data.token_expiry = data.token_expiry.trim();

  return {
    user_id: data.user_id,
    user_role: data.user_role,
    token: data.token,
    token_expiry: data.token_expiry,
  };
}

export async function encrypt(data) {
  if (!SECRET_KEY) {
    await get_secret_key();
    if (!SECRET_KEY || SECRET_KEY.length !== 64) {
      throw new Error(
        "Invalid SECRET_KEY. Ensure it is a 64-character hex string.",
      );
    }
  }

  const keyBuffer = Uint8Array.from(Buffer.from(SECRET_KEY, "hex"));

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM },
    false,
    ["encrypt"],
  );

  const jsonData = new TextEncoder().encode(JSON.stringify(data));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    jsonData,
  );

  const encryptedData = Buffer.concat([
    Buffer.from(iv),
    Buffer.from(encryptedBuffer),
  ]);

  return encryptedData.toString("base64");
}

export async function decrypt(encryptedData) {
  if (!SECRET_KEY) {
    await get_secret_key();
    if (!SECRET_KEY || SECRET_KEY.length !== 64) {
      throw new Error(
        "Invalid SECRET_KEY. Ensure it is a 64-character hex string.",
      );
    }
  }

  const keyBuffer = Uint8Array.from(Buffer.from(SECRET_KEY, "hex"));

  const encryptedBuffer = Buffer.from(encryptedData, "base64");

  const iv = encryptedBuffer.subarray(0, 12);
  const dataBuffer = encryptedBuffer.subarray(12);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM },
    false,
    ["decrypt"],
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    dataBuffer,
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);

  return JSON.parse(decryptedText);
}
