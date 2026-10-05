import { api, endpoints } from "./axios";
import type { ApiResponse, Visitor } from "@/features/visitors/visitors.types";

export interface ReceptionBookingPayload {
  visitorName: string;
  mobileNo: number;
  email: string;
  address?: string;
  purpose?: string;
  dateOfVisit: string;
  visitEndTime: string;
  hostId: string;
}

export async function getReceptionVisitors() {
  const response = await api.get<ApiResponse<Visitor[]>>(
    endpoints.visitor.receptionistVisitors,
  );
  return response.data;
}

export async function createReceptionBooking(payload: ReceptionBookingPayload) {
  const response = await api.post<ApiResponse<Visitor>>(
    endpoints.visitor.receptionistBookings,
    payload,
  );
  return response.data;
}

export async function manualCheckIn(id: string) {
  const response = await api.patch<ApiResponse<Visitor>>(
    endpoints.visitor.manualCheckIn(id),
  );
  return response.data;
}

export async function manualCheckOut(id: string) {
  const response = await api.patch<ApiResponse<Visitor>>(
    endpoints.visitor.manualCheckOut(id),
  );
  return response.data;
}

export async function scanCheckIn(qrDataString: string) {
  const response = await api.post<ApiResponse<Visitor>>(
    endpoints.visitor.scanCheckIn,
    { qrDataString },
  );
  return response.data;
}

export async function scanCheckOut(qrDataString: string) {
  const response = await api.post<ApiResponse<Visitor>>(
    endpoints.visitor.scanCheckOut,
    { qrDataString },
  );
  return response.data;
}
