import client from './client';

export const getOrders = async () => {
  const response = await client.get('/orders/');
  return response.data;
};

export const createOrder = async (data) => {
  const response = await client.post('/orders/', data);
  return response.data;
};

export const getOrder = async (id) => {
  const response = await client.get(`/orders/${id}`);
  return response.data;
};

export const updateOrder = async (id, data) => {
  const response = await client.put(`/orders/${id}`, data);
  return response.data;
};

export const assignDriver = async (orderId, data) => {
  const response = await client.put(`/orders/${orderId}/assign-driver`, data);
  return response.data;
};

export const updateOrderStatus = async (orderId, data) => {
  const response = await client.put(`/orders/${orderId}/status`, data);
  return response.data;
};

export const getOrderTimeline = async (orderId) => {
  const response = await client.get(`/orders/${orderId}/timeline`);
  return response.data;
};
