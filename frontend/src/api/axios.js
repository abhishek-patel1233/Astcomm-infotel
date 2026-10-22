import axios from 'axios';

// Create an Axios instance with a pre-configured base URL
const API = axios.create({
  baseURL: 'https://softwareb.onrender.com/api', // Yahan apna backend server URL dalein
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Request interceptor to automatically attach JWT token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;