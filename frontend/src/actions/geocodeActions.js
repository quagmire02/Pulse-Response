"use server";
import { reverseGeocode } from "@/libs/api";

export const reverseGeocodeAction = async (lat, lng) => {
  try {
    const response = await reverseGeocode({ lat, lng });

    if (response.error) {
      return { address: null };
    }

    return { address: response.address || null };
  } catch (error) {
    console.error(error);
    return { address: null };
  }
};
