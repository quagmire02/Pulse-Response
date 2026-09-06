import { getTokenFromSession } from "./cookie";

export class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async handleErrors(response) {
    const contentType = response.headers.get("Content-Type") || "";

    if (response.ok) {
      if (response.status === 204) {
        return { success: "Deleted successfully" };
      }
      if (contentType.includes("application/json")) {
        return await response.json();
      }
    }

    if (response.status >= 400) {
      if (response.status === 401) {
        return {
          error:
            "Unauthorized. Please refresh the page. If this persists, login again.",
        };
      }

      if (contentType.includes("application/json")) {
        try {
          const errorData = await response.json();

          console.log("Error data:", errorData);
          if (errorData.errors) {
            return { error: errorData.errors };
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
          return { error: "Unexpected error occurred." };
        }
      } else {
        return { error: "Unexpected error occurred." };
      }

    }

    if (response.status >= 500) {
      return { error: "Server error" };
    }

    throw new Error("Unexpected error occurred.");
  }

  async request(
    endpoint,
    method,
    data = null,
    additionalOptions = {},
    isMultipart = false,
  ) {
    const accessToken = await getTokenFromSession();
    const url = `${this.baseURL}${endpoint}`;

    let cookieHeader = "";

    let options = {
      method,
      headers: {
        Accept: "application/json",
        ...(cookieHeader && { Cookie: cookieHeader.trim() }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      credentials: "include",
      ...additionalOptions,
    };

    if (isMultipart && data instanceof FormData) {
      delete options.headers["Content-Type"];
      options.body = data;
    } else if (data) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      return await this.handleErrors(response);
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  async get(endpoint, additionalOptions = {}) {
    return await this.request(
      endpoint,
      "GET",
      null,
      additionalOptions
    );
  }

  async post(endpoint, data, additionalOptions = {}, isMultipart = false) {
    return await this.request(
      endpoint,
      "POST",
      data,
      additionalOptions,
      isMultipart,
    );
  }

  async patch(endpoint, data, additionalOptions = {}, isMultipart = false) {
    return await this.request(
      endpoint,
      "PATCH",
      data,
      additionalOptions,
      isMultipart,
    );
  }

  async put(endpoint, data, additionalOptions = {}, isMultipart = false) {
    return await this.request(
      endpoint,
      "PUT",
      data,
      additionalOptions,
      isMultipart,
    );
  }

  async delete(endpoint, data = null, additionalOptions = {}) {
    return await this.request(
      endpoint,
      "DELETE",
      data,
      additionalOptions
    );
  }
}
