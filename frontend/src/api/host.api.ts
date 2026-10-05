import { api, endpoints } from "./axios";
import type {
  ApiResponse,
  CreateVisitorPayload,
  Visitor,
} from "@/features/visitors/visitors.types";

export async function getHosts() {
  const response =
    await api.get<
      ApiResponse<Array<{ id: string; name: string; email: string }>>
    >("/hosts/public");
  return response.data;
}

export async function getHostAppointments() {
  const response = await api.get<ApiResponse<Visitor[]>>(
    endpoints.host.appointments,
  );
  return response.data;
}

export async function getHostNotifications() {
  const response = await api.get<ApiResponse<Visitor[]>>(
    endpoints.host.notifications,
  );
  return response.data;
}

export async function createHostAppointment(
  payload: Omit<CreateVisitorPayload, "whomToMeet" | "hostId">,
) {
  const response = await api.post<ApiResponse<Visitor>>(
    endpoints.host.appointments,
    payload,
  );
  return response.data;
}

export async function decideHostAppointment(
  id: string,
  decision: "approve" | "reject",
) {
  const response = await api.patch<ApiResponse<Visitor>>(
    endpoints.host.decideAppointment(id),
    { decision },
  );
  return response.data;
}
