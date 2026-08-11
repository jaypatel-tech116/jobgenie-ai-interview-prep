import axios from "axios";

let envUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Strip trailing /api or /api/ if user provided it in VITE_API_URL, since all service endpoints include /api/...
envUrl = envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: envUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jg_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
