import api from "./api";

export type ServiceTabItemType = "service" | "product" | "consumption";
export interface ServiceTabItem { id: string; type: ServiceTabItemType; referenceId?: string | null; name: string; unitPrice: number; quantity: number; total: number; createdAt: string }
export interface ServiceTab {
  id: string; appointmentId: string; status: "open" | "paid"; notes?: string | null;
  total: number; openedAt: string; closedAt?: string | null;
  appointment: { id: string; status: string; startAt: string; client: { id: string; name: string }; barber: { id: string; displayName: string } };
  items: ServiceTabItem[];
}
export async function listServiceTabs(status?: "open" | "paid") { return (await api.get<ServiceTab[]>("/service-tabs", { params: { status } })).data; }
export async function openServiceTab(appointmentId: string) { return (await api.post<ServiceTab>("/service-tabs", { appointmentId })).data; }
export async function addServiceTabItem(tabId: string, data: { type: ServiceTabItemType; referenceId?: string | null; name?: string | null; quantity: number; unitPrice?: number | null }) { return (await api.post<ServiceTab>(`/service-tabs/${tabId}/items`, data)).data; }
export async function removeServiceTabItem(tabId: string, itemId: string) { return (await api.delete<ServiceTab>(`/service-tabs/${tabId}/items/${itemId}`)).data; }
export async function payServiceTab(tabId: string, method: "pix" | "debito" | "credito" | "dinheiro") { return (await api.post<ServiceTab>(`/service-tabs/${tabId}/pay`, { method })).data; }
