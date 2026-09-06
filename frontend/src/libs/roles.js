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
    description: "Manage the medicine catalogue for your pharmacy. Does not take consultations.",
  },
  {
    value: "doctor",
    label: "Doctor",
    description: "Publish consultation slots and see patients. Does not manage medicines.",
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

// Only doctors publish consultation slots, so only they give a speciality
// and bio. Pharmacists are a separate profession that manages medicines.
export const DOCTOR_ROLES = ["doctor"];

// Roles that need an organisation name. A pharmacist supplies their pharmacy
// name through the same field.
export const COMPANY_ROLES = ["vendor", "ambulance_company", "pharmacist"];

// Roles that must supply a licence number of some kind.
export const LICENSED_ROLES = ["pharmacist", "doctor", "vendor", "ambulance_company", "driver"];

export const isAdminRole = (role) => role === "admin" || role === "super_admin";

// Only plain customers can fill a cart, place orders and book rentals.
export const isCustomerRole = (role) => role === "user";

export const roleLabel = (role) => ROLE_LABELS[role] || role;
