"use server";

import { getVendorDashboard, getAmbulanceDashboard } from "@/libs/api";

export const getVendorDashboardAction = async (queryParams = {}) => {
  try {
    const response = await getVendorDashboard(queryParams);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch vendor dashboard metrics." };
  }
};

export const getAmbulanceDashboardAction = async (queryParams = {}) => {
  try {
    const response = await getAmbulanceDashboard(queryParams);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "Failed to fetch ambulance dashboard metrics." };
  }
};
