import { api, endpoints } from "./axios";
import type { AuthResponse } from "@/types/auth";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  name: string;
}

export async function login(credentials: AuthCredentials) {
  const response = await api.post<AuthResponse>(
    endpoints.auth.login,
    credentials,
  );
  return response.data;
}

export async function register(credentials: RegisterCredentials) {
  const response = await api.post<AuthResponse>(
    endpoints.auth.register,
    credentials,
  );
  return response.data;
}
