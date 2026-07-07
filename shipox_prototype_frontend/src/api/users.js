import client from './client';

export const getUsers = async () => {
  const response = await client.get('/users/');
  return response.data;
};

export const createUser = async (data) => {
  const response = await client.post('/users/', data);
  return response.data;
};

export const getUser = async (id) => {
  const response = await client.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await client.put(`/users/${id}`, data);
  return response.data;
};
