import api from "./api";

export type ServiceTabItemType = "service" | "product" | "consumption";
export type ServiceTabStatus = "open" | "paid" | "canceled";

export interface ServiceTabItem {
  id: string;
  type: ServiceTabItemType;
  referenceId?: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  isOriginal: boolean;
  responsibleBarber?: { id: string; displayName: string } | null;
  createdAt: string;
}

export interface ServiceTab {
  id: string;
  appointmentId: string;
  status: ServiceTabStatus;
  notes?: string | null;
  total: number;
  amountDue: number;
  openedAt: string;
  closedAt?: string | null;
  payment?: { id: string; status: string | null; paidAt?: string | null } | null;
  canFinalize: boolean;
  appointment: {
    id: string;
    status: string;
    startAt: string;
    client: { id: string; name: string };
    barber: { id: string; displayName: string };
  };
  items: ServiceTabItem[];
}

export interface ServiceTabItemPayload {
  type: ServiceTabItemType;
  referenceId?: string | null;
  name?: string | null;
  quantity: number;
  unitPrice?: number | null;
  responsibleBarberId?: string | null;
}

export async function listServiceTabs(status?: ServiceTabStatus) {
  return (await api.get<ServiceTab[]>("/service-tabs", { params: { status } })).data;
}

export async function openServiceTab(appointmentId: string) {
  return (await api.post<ServiceTab>("/service-tabs", { appointmentId })).data;
}

export async function addServiceTabItem(tabId: string, data: ServiceTabItemPayload) {
  return (await api.post<ServiceTab>(`/service-tabs/${tabId}/items`, data)).data;
}

export async function updateServiceTabItem(tabId: string, itemId: string, data: Partial<Omit<ServiceTabItemPayload, "type" | "referenceId">>) {
  return (await api.patch<ServiceTab>(`/service-tabs/${tabId}/items/${itemId}`, data)).data;
}

export async function removeServiceTabItem(tabId: string, itemId: string) {
  return (await api.delete<ServiceTab>(`/service-tabs/${tabId}/items/${itemId}`)).data;
}

export async function finalizeServiceTab(tabId: string) {
  return (await api.post<ServiceTab>(`/service-tabs/${tabId}/finalize`)).data;
}

export async function cancelServiceTab(tabId: string) {
  return (await api.post<ServiceTab>(`/service-tabs/${tabId}/cancel`)).data;
}

export async function payServiceTab(tabId: string, method: "pix" | "debito" | "credito" | "dinheiro") {
  return (await api.post<ServiceTab>(`/service-tabs/${tabId}/pay`, { method })).data;
}
