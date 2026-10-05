import axios from "axios";
import { endpoints } from "./endpoints";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3002/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const storedAuth = localStorage.getItem("auth-storage");

  if (storedAuth) {
    try {
      const { state } = JSON.parse(storedAuth) as {
        state?: { accessToken?: string | null };
      };

      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch {
      localStorage.removeItem("auth-storage");
    }
  }

  return config;
});

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message || "The request could not be completed."
    );
  }

  return "The request could not be completed.";
};

export { endpoints };
