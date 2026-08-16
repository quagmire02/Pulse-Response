"use server";
import {
  rentEquipment,
  triggerEmergencyAlert,
  getLedgerTimeline,
  getLedgerSummary,
  getPatientTimeline,
  getPatientSummary,
} from "@/libs/api";

export const getLedgerTimelineAction = async (queryParams = {}) => {
  try {
    const response = await getLedgerTimeline(queryParams);
    if (response.error) return { error: response.error };
    return {
      data: response.data,
      pagination: {
        count: response.total,
        total_pages: response.last_page,
      },
    };
  } catch (error) {
    return { error: error.message || "Failed to fetch timeline history." };
  }
};

export const getLedgerSummaryAction = async () => {
  try {
    const response = await getLedgerSummary();
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to fetch summary." };
  }
};

export const getPatientTimelineAction = async (patientId, queryParams = {}) => {
  try {
    const response = await getPatientTimeline(patientId, queryParams);
    if (response.error) return { error: response.error };
    return {
      data: response.data,
      pagination: {
        count: response.total,
        total_pages: response.last_page,
      },
    };
  } catch (error) {
    return { error: error.message || "Failed to fetch patient timeline history." };
  }
};

export const getPatientSummaryAction = async (patientId) => {
  try {
    const response = await getPatientSummary(patientId);
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to fetch patient summary." };
  }
};

export const rentEquipmentAction = async (data) => {
  try {
    const response = await rentEquipment(data);
    if (response.error) return { error: response.error };
    return { success: response.success || "Equipment rented successfully.", data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to rent equipment." };
  }
};

export const triggerEmergencyAlertAction = async (data) => {
  try {
    const response = await triggerEmergencyAlert(data);
    if (response.error) return { error: response.error };
    return { success: response.success || "Emergency alert dispatched.", data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to trigger emergency alert." };
  }
};
