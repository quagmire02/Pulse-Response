"use server";
import {
  getVolunteerProfile,
  getVolunteerAppearance,
  getVolunteerStats,
  updateVolunteerLocation,
  setVolunteerAvailability,
  respondToVolunteerAlert,
  redeemVolunteerReward,
  applyVolunteerReward,
} from "@/libs/api";

export const getVolunteerProfileAction = async () => {
  try {
    const response = await getVolunteerProfile();
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to load your volunteer profile." };
  }
};

/**
 * Returns the caller's chosen theme and typeface, defaulting for anyone who is
 * not a volunteer, so the layout can call it unconditionally.
 */
export const getVolunteerAppearanceAction = async () => {
  try {
    const response = await getVolunteerAppearance();
    if (response.error) return { theme: "default", font: "default" };
    return { theme: response.theme, font: response.font };
  } catch (error) {
    return { theme: "default", font: "default" };
  }
};

export const getVolunteerStatsAction = async () => {
  try {
    const response = await getVolunteerStats();
    if (response.error) return { error: response.error };
    return { data: response };
  } catch (error) {
    return { error: error.message || "Failed to load volunteer stats." };
  }
};

export const updateVolunteerLocationAction = async (latitude, longitude) => {
  try {
    const response = await updateVolunteerLocation({ latitude, longitude });
    if (response.error) return { error: response.error };
    return { success: response.success };
  } catch (error) {
    return { error: error.message || "Failed to update location." };
  }
};

export const setVolunteerAvailabilityAction = async (isAvailable) => {
  try {
    const response = await setVolunteerAvailability({ is_available: isAvailable });
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to change availability." };
  }
};

export const respondToVolunteerAlertAction = async (id) => {
  try {
    const response = await respondToVolunteerAlert(id);
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to log your response." };
  }
};

export const redeemVolunteerRewardAction = async (rewardKey) => {
  try {
    const response = await redeemVolunteerReward({ reward: rewardKey });
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data, rewards: response.rewards };
  } catch (error) {
    return { error: error.message || "Failed to redeem the reward." };
  }
};

export const applyVolunteerRewardAction = async (type, value) => {
  try {
    const response = await applyVolunteerReward({ type, value });
    if (response.error) return { error: response.error };
    return { success: response.success, data: response.data };
  } catch (error) {
    return { error: error.message || "Failed to apply the reward." };
  }
};
