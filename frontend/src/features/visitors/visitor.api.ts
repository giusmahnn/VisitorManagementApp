import { api, endpoints } from "@/api/axios";
import type {
  ApiResponse,
  CreateVisitorPayload,
  Visitor,
} from "./visitors.types";

export async function getBookingHosts() {
  const response =
    await api.get<
      ApiResponse<Array<{ id: string; name: string; email: string }>>
    >("/hosts/public");
  return response.data;
}

export async function createVisitor(payload: CreateVisitorPayload) {
  const response = await api.post<ApiResponse<Visitor>>(
    endpoints.visitor.createVisitor,
    payload,
  );

  return response.data;
}
