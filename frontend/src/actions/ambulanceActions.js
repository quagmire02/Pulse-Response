"use server";

import {
  getAmbulanceCompany,
  getMyAmbulance,
  updateAmbulanceLocation,
  setAmbulanceStatus,
  completeAmbulanceAssignment,
  getAmbulanceFleet,
  getUnassignedAmbulances,
  createAmbulanceVehicle,
  updateAmbulanceVehicle,
  deleteAmbulanceVehicle,
  getAmbulanceCompanies,
} from "@/libs/api";

export const getAmbulanceCompanyAction = async (userId) => {
  try {
    const response = await getAmbulanceCompany(userId);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch ambulance company profile." };
  }
};

export const getMyAmbulanceAction = async () => {
  try {
    const response = await getMyAmbulance();
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to load your ambulance." };
  }
};

export const updateAmbulanceLocationAction = async (latitude, longitude) => {
  try {
    const response = await updateAmbulanceLocation({ latitude, longitude });
    if (response.error) return { error: response.error };
    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Failed to update location." };
  }
};

export const setAmbulanceStatusAction = async (status) => {
  try {
    const response = await setAmbulanceStatus({ status });
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to update status." };
  }
};

export const completeAmbulanceAssignmentAction = async (alertId) => {
  try {
    const response = await completeAmbulanceAssignment(alertId);
    if (response.error) return { error: response.error };
    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Failed to complete the assignment." };
  }
};

export const getAmbulanceFleetAction = async () => {
  try {
    const response = await getAmbulanceFleet();
    if (response.error) return { error: response.error };
    return { data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to load the fleet." };
  }
};

export const getUnassignedAmbulancesAction = async () => {
  try {
    const response = await getUnassignedAmbulances();
    if (response.error) return { error: response.error };
    return { data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to load unassigned ambulances." };
  }
};

export const createAmbulanceVehicleAction = async (data) => {
  try {
    const response = await createAmbulanceVehicle(data);
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to add the ambulance." };
  }
};

export const updateAmbulanceVehicleAction = async (id, data) => {
  try {
    const response = await updateAmbulanceVehicle(id, data);
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to update the ambulance." };
  }
};

export const deleteAmbulanceVehicleAction = async (id) => {
  try {
    const response = await deleteAmbulanceVehicle(id);
    if (response.error) return { error: response.error };
    return { success: "Ambulance removed." };
  } catch (error) {
    return { error: error.message || "Failed to remove the ambulance." };
  }
};

export const getAmbulanceCompaniesAction = async () => {
  try {
    const response = await getAmbulanceCompanies();
    if (response.error) return { error: response.error };
    return { data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to load ambulance companies." };
  }
};
