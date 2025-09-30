import { authApi } from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface User {
  username: string;
  email: string;
  name: string;
  age: number;
  phone_number: string;
  is_admin: boolean;
}

export const login = async (username: string, password: string): Promise<User> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await authApi.login(username, password);
  const { access_token } = response.data;
  
  // Store the token
  localStorage.setItem('token', access_token);
  
  // Fetch user data
  const userResponse = await authApi.getCurrentUser();
  return userResponse.data;
};

export const register = async (data: {
  username: string;
  email: string;
  password: string;
  name: string;
  age: number;
  phone_number: string;
}): Promise<void> => {
  await authApi.register(data);
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await authApi.getCurrentUser();
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    return null;
  }
}; 