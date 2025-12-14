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

const marketplaceService = {
  getProducts: async (category, search) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    const response = await api.get(`/api/marketplace/products?${params.toString()}`);
    return response.data;
  },
  getProduct: async (productId) => {
    const response = await api.get(`/api/marketplace/products/${productId}`);
    return response.data;
  },
  getMarketplaceCategories: async () => {
    const response = await api.get("/api/marketplace/categories");
    return response.data;
  },
  purchaseProduct: async (productId) => {
    const response = await api.post(`/api/marketplace/products/${productId}/purchase`);
    return response.data;
  },
};

export default marketplaceService;
