"use server";

import { getAmbulanceCompany } from "@/libs/api";

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
