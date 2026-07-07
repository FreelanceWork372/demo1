import client from './client';

export const getAdminDashboard = async () => {
  const response = await client.get('/dashboard/admin');
  return response.data;
};

export const getMerchantDashboard = async () => {
  const response = await client.get('/dashboard/merchant');
  return response.data;
};

export const getDriverDashboard = async () => {
  const response = await client.get('/dashboard/driver');
  return response.data;
};
