import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const cartService = {
  getCart: async () => {
    const res = await api.get("/api/cart");
    return res.data;
  },
  addToCart: async (productId, quantity = 1) => {
    const res = await api.post(`/api/cart?product_id=${productId}&quantity=${quantity}`);
    return res.data;
  },
  updateCartItem: async (itemId, quantity) => {
    const res = await api.put(`/api/cart/${itemId}?quantity=${quantity}`);
    return res.data;
  },
  removeCartItem: async (itemId) => {
    const res = await api.delete(`/api/cart/${itemId}`);
    return res.data;
  },
  createOrder: async () => {
    const res = await api.post("/api/orders");
    return res.data;
  },
  createCheckoutSession: async () => {
    const res = await api.post("/api/checkout/session");
    return res.data;
  },
  getOrders: async () => {
    const res = await api.get("/api/orders");
    return res.data;
  },
};

export default cartService;
