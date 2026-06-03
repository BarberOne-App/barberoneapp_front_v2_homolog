import api from "./api";

export interface Barber {
  id: string;
  displayName: string;
  specialty?: string | null;
  photoUrl?: string | null;
  userId?: string | null;
  serviceIds?: string[];
  salarioFixo?: number | null;
  commissionPercent?: number | null;
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

export async function getMyBarber() {
  const response = await api.get<Barber>("/barbers/me");

  return response.data;
}

export async function updateBarber(barberId: string, data: { salarioFixo?: number | null }) {
  const response = await api.patch<Barber>(`/barbers/${barberId}`, data);

  return response.data;
}
