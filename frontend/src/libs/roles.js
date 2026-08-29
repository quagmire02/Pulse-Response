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
    description: "List medical equipment for rent or sale.",
  },
  {
    value: "ambulance_company",
    label: "Ambulance Company",
    description: "Operate an ambulance fleet and respond to emergencies.",
  },
  {
    value: "volunteer",
    label: "Community Volunteer",
    description: "Get alerted to emergencies near you and help before the ambulance arrives.",
  },
  {
    value: "driver",
    label: "Ambulance Driver",
    description: "Drive an ambulance. An admin assigns you to a vehicle on approval.",
  },
];

export const ROLE_LABELS = {
  user: "Customer",
  pharmacist: "Pharmacist",
  doctor: "Doctor",
  vendor: "Vendor",
  ambulance_company: "Ambulance Company",
  driver: "Ambulance Driver",
  volunteer: "Community Volunteer",
  admin: "Admin",
  super_admin: "Super Admin",
};

// Roles that submit a pharmacist profile (license, speciality, bio).
export const PHARMACIST_ROLES = ["pharmacist", "doctor"];

// Roles that run a company and therefore need a company name.
export const COMPANY_ROLES = ["vendor", "ambulance_company"];

// Roles that must supply a licence number of some kind.
export const LICENSED_ROLES = ["pharmacist", "doctor", "vendor", "ambulance_company", "driver"];

export const isAdminRole = (role) => role === "admin" || role === "super_admin";

// Only plain customers can fill a cart, place orders and book rentals.
export const isCustomerRole = (role) => role === "user";

export const roleLabel = (role) => ROLE_LABELS[role] || role;
