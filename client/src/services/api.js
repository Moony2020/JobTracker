import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// No need for interceptor with HttpOnly cookies
export default api;
