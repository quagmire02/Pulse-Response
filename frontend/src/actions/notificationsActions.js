"use server";
import {
  getNotifications,
  getNotification,
  getAvailableNotification,
  updateNotification,
  deleteNotification,
} from "@/libs/api";

export const getNotificationsAction = async (queryParams = {}) => {
  try {
    const response = await getNotifications(queryParams);

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
    return { error: error.message || "Failed to fetch users." };
  }
};

export const getAvailableNotificationAction = async () => {
  try {
    const response = await getAvailableNotification();

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const getNotificationAction = async (id) => {
  try {
    const response = await getNotification(id);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};

export const updateNotificationAction = async (id) => {
  try {
    const response = await updateNotification(id);

    if (response.error) {
      return { error: response.error };
    }

    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};


export const deleteNotificationAction = async (id) => {
  try {
    const response = await deleteNotification(id);

    if (response.error) {
      return { error: response.error };
    }
    
    return { success: response.success };
  } catch (error) {
    console.error(error);
    return { error: error.message || "An unexpected Error occured" };
  }
};
