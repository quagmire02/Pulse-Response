// Roles a visitor can request on the signup form. These mirror
// App\Models\SignupRequest::ROLES on the backend.
export const SIGNUP_ROLES = [
  {
    value: "user",
    label: "Customer",
    description: "Order medicines and rent medical equipment.",
  },
  {
    value: "pharmacist",
    label: "Pharmacist",
    description: "Manage a pharmacy profile and offer consultations.",
  },
  {
    value: "doctor",
    label: "Doctor",
    description: "Publish consultation slots and review patient history.",
  },
  {
    value: "vendor",
    label: "Vendor",
    description: "List medical equipment for rent.",
  },
];

export const ROLE_LABELS = {
  user: "Customer",
  pharmacist: "Pharmacist",
  doctor: "Doctor",
  vendor: "Vendor",
  ambulance_company: "Ambulance Company",
  admin: "Admin",
  super_admin: "Super Admin",
};

// Roles that submit a pharmacist profile (license, speciality, bio).
export const PHARMACIST_ROLES = ["pharmacist", "doctor"];

export const isAdminRole = (role) => role === "admin" || role === "super_admin";

// Only plain customers can fill a cart, place orders and book rentals.
export const isCustomerRole = (role) => role === "user";

export const roleLabel = (role) => ROLE_LABELS[role] || role;
