"use server";
import {
  createSignupRequest,
  getSignupRequests,
  getPendingSignupRequestCount,
  approveSignupRequest,
  rejectSignupRequest,
  deleteSignupRequest,
} from "@/libs/api";

// Mirrors App\Models\SignupRequest::ROLES on the backend.
const SIGNUP_ROLES = ["user", "pharmacist", "doctor", "vendor", "ambulance_company", "driver", "volunteer"];

const actionError = (response) => {
  if (typeof response.error === "object") {
    const keys = [
      "email",
      "username",
      "first_name",
      "last_name",
      "address",
      "password",
      "password_confirmation",
      "role",
      "license_num",
      "speciality",
      "bio",
      "company_name",
      "description",
      "contact_phone",
    ];
    const errorMessages = {};
    keys.forEach((key) => {
      if (response.error[key]) errorMessages[key] = response.error[key];
    });

    if (Object.keys(errorMessages).length === 0) {
      return { error: { error: "Please review the form and try again." } };
    }

    return { error: errorMessages };
  }

  return { error: { error: response.error } };
};

export const createSignupRequestAction = async (formData) => {
  const role = formData.get("role");
  const email = formData.get("email");
  const username = formData.get("username");
  const password = formData.get("password");
  const password_confirmation = formData.get("password_confirmation");

  const errors = {};

  if (!role) {
    errors.role = "Please choose an account type.";
  } else if (!SIGNUP_ROLES.includes(role)) {
    errors.role = "Please choose a valid account type.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!email.includes("@")) {
    errors.email = "Invalid email format.";
  }

  if (!username) {
    errors.username = "Username is required.";
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

  const optional = [
    "first_name",
    "last_name",
    "address",
    "license_num",
    "speciality",
    "bio",
    "company_name",
    "description",
    "contact_phone",
  ];

  const data = {
    email,
    username,
    password,
    password_confirmation,
    role,
  };

  optional.forEach((key) => {
    const value = formData.get(key);
    if (value) data[key] = value;
  });

  if (["pharmacist", "doctor"].includes(role)) {
    data.is_consultation = formData.get("is_consultation") === "on";
  }

  try {
    const response = await createSignupRequest(data);

    if (response.error) {
      return actionError(response);
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: { error: error.message || "Failed to submit signup request." } };
  }
};

export const getSignupRequestsAction = async (queryParams = {}) => {
  try {
    const response = await getSignupRequests(queryParams);

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
    return { error: error.message || "Failed to fetch signup requests." };
  }
};

export const getPendingSignupRequestCountAction = async () => {
  try {
    const response = await getPendingSignupRequestCount();

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.count };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch pending signup requests." };
  }
};

export const approveSignupRequestAction = async (id, vehicleId = null) => {
  try {
    const response = await approveSignupRequest(id, vehicleId ? { vehicle_id: vehicleId } : {});

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to approve signup request." };
  }
};

export const rejectSignupRequestAction = async (id, rejectionReason = "") => {
  try {
    const response = await rejectSignupRequest(id, {
      ...(rejectionReason && { rejection_reason: rejectionReason }),
    });

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to reject signup request." };
  }
};

export const deleteSignupRequestAction = async (id) => {
  try {
    const response = await deleteSignupRequest(id);

    if (response.error) {
      return { error: response.error };
    }

    return { success: "Signup request removed." };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to remove signup request." };
  }
};
