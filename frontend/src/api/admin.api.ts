import { api, endpoints } from "./axios";
import type { AuthUser } from "@/types/auth";
import type { ApiResponse, Visitor } from "@/features/visitors/visitors.types";

export interface CreateHostPayload {
  name: string;
  email: string;
}

export interface CreateHostResponse {
  success: boolean;
  message: string;
  data?: {
    host: AuthUser;
    credentials: { email: string; temporaryPassword: string };
    emailSent: boolean;
  };
  error?: string;
}

export interface CreateReceptionistResponse {
  success: boolean;
  message: string;
  data?: {
    receptionist: AuthUser;
    credentials: { email: string; temporaryPassword: string };
    emailSent: boolean;
  };
  error?: string;
}

export async function createHost(payload: CreateHostPayload) {
  const response = await api.post<CreateHostResponse>(
    endpoints.admin.createHost,
    payload,
  );
  return response.data;
}

export async function createReceptionist(payload: CreateHostPayload) {
  const response = await api.post<CreateReceptionistResponse>(
    endpoints.admin.createReceptionist,
    payload,
  );
  return response.data;
}

export async function getAdminVisitors() {
  const response = await api.get<ApiResponse<Visitor[]>>(
    endpoints.visitor.getVisitors,
  );
  return response.data;
}
