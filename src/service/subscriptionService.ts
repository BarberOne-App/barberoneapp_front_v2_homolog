import api from "./api";

export interface SubscriptionUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  color?: string | null;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  barbershopId: string;
  user: SubscriptionUser | null;
  plan: SubscriptionPlan | null;
  amount: number;
  status: "active" | "paused" | "cancelled" | "expired";
  nextBillingAt: string | null;
  startedAt: string | null;
  paymentMethod?: string | null;
}

export interface ListSubscriptionsParams {
  status?: string;
  search?: string;
  searchType?: "name" | "cpf";
  page?: number;
  limit?: number;
}

export interface ListSubscriptionsResponse {
  page: number;
  limit: number;
  total: number;
  items: Subscription[];
}

export async function listSubscriptions(params: ListSubscriptionsParams = {}) {
  const response = await api.get<ListSubscriptionsResponse>("/subscriptions", { params });
  return response.data;
}

export async function updateSubscription(
  id: string,
  data: { status?: Subscription["status"] },
) {
  const response = await api.patch<Subscription>(`/subscriptions/${id}`, data);
  return response.data;
}

export interface CreateSubscriptionPayload {
  userId: string;
  planId: string;
  amount: number;
  paymentMethod?: string;
}

export async function createSubscription(data: CreateSubscriptionPayload) {
  const response = await api.post<Subscription>("/subscriptions", data);
  return response.data;
}
