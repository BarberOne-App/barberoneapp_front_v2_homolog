import api from "./api";

export interface BarbershopProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  slug: string;
}

export interface UpdateBarbershopProfilePayload {
  name: string;
  email: string;
  phone: string;
  cnpj: string;
}

export async function getBarbershopProfile() {
  const response = await api.get<BarbershopProfile>("/barbershop/profile");
  return response.data;
}

export async function updateBarbershopProfile(
  data: UpdateBarbershopProfilePayload
) {
  const response = await api.put<BarbershopProfile>("/barbershop/profile", {
    name: data.name,
    email: data.email,
    phone: data.phone,
    cnpj: data.cnpj,
  });

  return response.data;
}
