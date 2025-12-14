import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authService = {
  register: async (userData) => {
    const response = await api.post("/api/auth/register", userData);
    if (response.data?.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }
    return response;
  },
  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    if (response.data?.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }
    return response;
  },
  logout: () => {
    localStorage.removeItem("access_token");
  },
  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
  isAuthenticated: () => {
    return Boolean(localStorage.getItem("access_token"));
  },
};

export default authService;
