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

const subscriptionService = {
  getPlans: async () => {
    const res = await api.get("/api/subscriptions/plans");
    return res.data;
  },
  selectPlan: async (planId) => {
    const res = await api.post(`/api/subscriptions/select?plan_id=${planId}`);
    return res.data;
  },
};

export default subscriptionService;
