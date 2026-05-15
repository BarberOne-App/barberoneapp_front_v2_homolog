import api from "./api";

export interface Barber {
  id: string;
  displayName: string;
  specialty?: string | null;
  photoUrl?: string | null;
  userId?: string | null;
  serviceIds?: string[];
}

export interface ListBarbersResponse {
  page: number;
  limit: number;
  total: number;
  items: Barber[];
}

export async function listBarbers(params: { q?: string; page?: number; limit?: number } = {}) {
  const response = await api.get<ListBarbersResponse>("/barbers", { params });

  return response.data;
}
