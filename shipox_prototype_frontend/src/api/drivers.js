import client from './client';

export const getDrivers = async () => {
  const response = await client.get('/drivers/');
  return response.data;
};

export const createDriver = async (data) => {
  const response = await client.post('/drivers/', data);
  return response.data;
};

export const getDriver = async (id) => {
  const response = await client.get(`/drivers/${id}`);
  return response.data;
};

export const updateDriver = async (id, data) => {
  const response = await client.put(`/drivers/${id}`, data);
  return response.data;
};

export const getMyDriverProfile = async () => {
  const response = await client.get('/drivers/me');
  return response.data;
};
