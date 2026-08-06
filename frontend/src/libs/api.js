import { ApiClient } from "./apiClient";

const API_URL = process.env.API_BASE_URL;
const apiClient = new ApiClient(API_URL);

export const login = async (data) => {
  return apiClient.post("/login/", data);
};

export const logout = async () => {
  return await apiClient.post("/logout/");
};

export const getUsers = async () => {
  return apiClient.get(`/users/`);
};

export const getUser = async (id) => {
  return apiClient.get(`/users/${id}/`);
};

export const createUser = async (data) => {
  return apiClient.post("/users/", data);
};

export const updateUser = async (id, data) => {
  return apiClient.put(`/users/${id}/`, data);
};

export const deleteUser = async (id) => {
  return apiClient.delete(`/users/${id}/`);
};

export const getPharmacists = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/pharmacists/?${params.toString()}`);
};

export const getPharmacist = async (id) => {
  return apiClient.get(`/pharmacists/${id}/`);
};

export const createPharmacist = async (data) => {
  return apiClient.post("/pharmacists/", data);
};

export const updatePharmacist = async (id, data) => {
  return apiClient.patch(`/pharmacists/${id}/`, data);
};

export const getCategories = async () => {
  return apiClient.get(`/categories/`);
};

export const getCategory = async (id) => {
  return apiClient.get(`/categories/${id}/`);
};

export const createCategory = async (data) => {
  return apiClient.post("/categories/", data);
};

export const deleteCategory = async (id) => {
  return apiClient.delete(`/categories/${id}/`);
};

export const getMedicines = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/medicines/?${params.toString()}`);
};

export const getMedicine = async (id) => {
  return apiClient.get(`/medicines/${id}/`);
};

export const createMedicine = async (data) => {
  return apiClient.post("/medicines/", data, {}, true);
};

export const updateMedicine = async (id, data, isImage = false) => {
  if (isImage) {
    data.append('_method', 'PATCH');
    return apiClient.post(`/medicines/${id}/`, data, {}, true);
  }
  return apiClient.patch(`/medicines/${id}/`, data);
};

export const deleteMedicine = async (id) => {
  return apiClient.delete(`/medicines/${id}/`);
};

export const getCartItems = async (user_id) => {
  return apiClient.get(`/cart-items/${user_id}/`);
};

export const updateCartItems = async (cart_id, data) => {
  return apiClient.put(`/cart-items/${cart_id}/`, data);
};

export const deleteCartItem = async (cart_id) => {
  return apiClient.delete(`/cart-items/${cart_id}/`);
};

export const getOrders = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/orders/?${params.toString()}`);
};

export const getOrder = async (id) => {
  return apiClient.get(`/orders/${id}/`);
};

export const createOrder = async (data) => {
  return apiClient.post("/orders/", data, {}, true);
};

export const updateOrder = async (id, data) => {
  return apiClient.patch(`/orders/${id}/`, data);
};

export const deleteOrder = async (id) => {
  return apiClient.delete(`/orders/${id}/`);
};

export const getPayments = async () => {
  return apiClient.get(`/payments/`);
};

export const getPayment = async (id) => {
  return apiClient.get(`/payments/${id}/`);
};

export const createPayment = async (data) => {
  return apiClient.post("/payments/", data);
};

export const deletePayment = async (id) => {
  return apiClient.delete(`/payments/${id}/`);
};

export const getDeliveries = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/deliveries/?${params.toString()}`);
};

export const getDelivery = async (id) => {
  return apiClient.get(`/deliveries/${id}/`);
};

export const deleteDelivery = async (id) => {
  return apiClient.delete(`/deliveries/${id}/`);
};

export const getNotifications = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/notifications/?${params.toString()}`);
};

export const getAvailableNotification = async() => {
  return apiClient.get(`/notifications/available/`);
}

export const getNotification = async (id) => {
  return apiClient.get(`/notifications/${id}/`);
};

export const updateNotification = async (id) => {
  return apiClient.put(`/notifications/${id}/`, {});
};

export const deleteNotification = async (id) => {
  return apiClient.delete(`/notifications/${id}/`);
};

export const getSlots = async (pharmacist_id, queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/slots/${pharmacist_id}/?${params.toString()}`);
};

export const getConsultations = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return apiClient.get(`/consultations/?${params.toString()}`);
};

export const getConsultation = async (id) => {
  return apiClient.get(`/consultations/${id}/`);
};

export const createConsultation = async (data) => {
  return apiClient.post("/consultations/", data);
};

export const updateConsultation = async (id, data) => {
  return apiClient.patch(`/consultations/${id}/`, data);
};

export const deleteConsultation = async (id) => {
  return apiClient.delete(`/consultations/${id}/`);
};