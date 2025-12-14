import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiService = {
  getFigures: () => api.get("/api/figures"),
  getFigure: (id) => api.get(`/api/figures/${id}`),
  getEvents: () => api.get("/api/events"),
  getEvent: (id) => api.get(`/api/events/${id}`),
  getCategories: () => api.get("/api/categories"),
  askAI: (message, options = {}) =>
    api.post("/api/ai/chat", {
      message,
      temperature: options.temperature ?? 0.2,
      top_p: options.top_p ?? 0.7,
      max_tokens: options.max_tokens ?? 512,
      thinking: options.thinking ?? true,
    }),
};

export default apiService;
