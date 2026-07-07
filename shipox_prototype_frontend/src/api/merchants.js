import client from './client';

export const getMerchants = async () => {
  const response = await client.get('/merchants/');
  return response.data;
};

export const createMerchant = async (data) => {
  const response = await client.post('/merchants/', data);
  return response.data;
};

export const getMerchant = async (id) => {
  const response = await client.get(`/merchants/${id}`);
  return response.data;
};

export const updateMerchant = async (id, data) => {
  const response = await client.put(`/merchants/${id}`, data);
  return response.data;
};

export const getMyMerchantProfile = async () => {
  const response = await client.get('/merchants/me');
  return response.data;
};
