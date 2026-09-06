"use server";
import { sendChatbotMessage } from "@/libs/api";

export const sendChatbotMessageAction = async (message) => {
  try {
    const response = await sendChatbotMessage({ message });

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  } catch (error) {
    console.error(error);
    return { error: error.message || "The assistant is unavailable right now." };
  }
};
