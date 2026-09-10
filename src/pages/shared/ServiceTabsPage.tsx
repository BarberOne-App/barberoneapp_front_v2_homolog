import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Coffee, Loader2, Minus, Package, Pencil, Plus, ReceiptText, Scissors, Trash2, UserRound, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAppointments, type Appointment } from "@/service/appointmentService";
import { listBarbers, type Barber } from "@/service/barberService";
import { listProducts, type Product } from "@/service/productService";
import { listServices, type Service } from "@/service/serviceService";
import { addServiceTabItem, cancelServiceTab, finalizeServiceTab, listServiceTabs, openServiceTab, removeServiceTabItem, updateServiceTabItem, type ServiceTab, type ServiceTabItem, type ServiceTabItemType } from "@/service/serviceTabService";

type View = "in_progress" | "open" | "paid" | "canceled";
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateKey = (value: string | Date) => { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const message = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error instanceof Error ? error.message : "Não foi possível concluir a operação.");
const emptyItem = { type: "service" as ServiceTabItemType, referenceId: "", name: "", quantity: 1, unitPrice: "", responsibleBarberId: "" };

function paymentsUrl(tab: ServiceTab) {
  const params = new URLSearchParams();
  if (tab.payment?.id) params.set("paymentId", tab.payment.id);
  const wasPaid = tab.payment?.status === "paid" || tab.payment?.status === "approved";
  params.set("date", dateKey(wasPaid ? (tab.payment?.paidAt ?? new Date()) : tab.appointment.startAt));
  return `/payments?${params.toString()}`;
}

export function ServiceTabsPage() {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<ServiceTab[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("in_progress");
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [newTabOpen, setNewTabOpen] = useState(false);
  const [itemTab, setItemTab] = useState<ServiceTab | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceTabItem | null>(null);
  const [itemForm, setItemForm] = useState(emptyItem);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tabData, appointmentData, serviceData, productData, barberData] = await Promise.all([
        listServiceTabs(),
        listAppointments({ status: "active", allAppointments: true, limit: 100 }),
        listServices({ limit: 100 }),
        listProducts({ active: true }),
        listBarbers({ limit: 100 }),
      ]);
      setTabs(tabData);
      setAppointments(appointmentData.items);
      setServices(serviceData.items.filter((item) => item.active));
      setProducts(productData.filter((item) => item.active));
      setBarbers(barberData.items);
    } catch (error) { toast.error(message(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredTabs = useMemo(() => tabs.filter((tab) => {
    if (dateKey(tab.appointment.startAt) !== selectedDate) return false;
    if (view === "in_progress") return tab.status === "open" && tab.appointment.status === "in_progress";
    return tab.status === view;
  }), [tabs, selectedDate, view]);
  const dayTabs = tabs.filter((tab) => dateKey(tab.appointment.startAt) === selectedDate);
  const used = new Set(tabs.map((tab) => tab.appointmentId));
  const available = appointments.filter((appointment) => !used.has(appointment.id) && dateKey(appointment.startAt) === selectedDate);
  const openTotal = dayTabs.filter((tab) => tab.status === "open").reduce((sum, tab) => sum + tab.amountDue, 0);

  async function act(action: () => Promise<unknown>, success: string, close?: () => void) {
    setBusy(true);
    try { await action(); toast.success(success); close?.(); await load(); }
    catch (error) { toast.error(message(error)); }
    finally { setBusy(false); }
  }

  function beginAdd(tab: ServiceTab) {
    setEditingItem(null);
    setItemForm({ ...emptyItem, responsibleBarberId: tab.appointment.barber.id });
    setItemTab(tab);
  }

  function beginEdit(tab: ServiceTab, item: ServiceTabItem) {
    setEditingItem(item);
    setItemForm({ type: item.type, referenceId: item.referenceId ?? "", name: item.name, quantity: item.quantity, unitPrice: String(item.unitPrice), responsibleBarberId: item.responsibleBarber?.id ?? tab.appointment.barber.id });
    setItemTab(tab);
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault(); if (!itemTab) return;
    if (editingItem) {
      await act(() => updateServiceTabItem(itemTab.id, editingItem.id, {
        quantity: itemForm.quantity,
        responsibleBarberId: itemForm.responsibleBarberId || null,
        ...(editingItem.type === "consumption" ? { name: itemForm.name, unitPrice: Number(itemForm.unitPrice) } : {}),
      }), "Item atualizado.", () => { setItemTab(null); setEditingItem(null); });
      return;
    }
    if (itemForm.type !== "consumption" && !itemForm.referenceId) return toast.error("Selecione o item.");
    if (itemForm.type === "consumption" && (!itemForm.name.trim() || Number(itemForm.unitPrice) < 0)) return toast.error("Informe o consumo e o valor.");
    await act(() => addServiceTabItem(itemTab.id, { type: itemForm.type, referenceId: itemForm.referenceId || null, name: itemForm.name || null, quantity: itemForm.quantity, unitPrice: itemForm.type === "consumption" ? Number(itemForm.unitPrice) : null, responsibleBarberId: itemForm.responsibleBarberId || null }), "Item adicionado à comanda.", () => setItemTab(null));
  }

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-semibold">Comandas</h1><p className="text-sm text-muted-foreground">Acompanhe o atendimento, envie a cobrança e finalize somente após o pagamento.</p></div>
      <Button onClick={() => setNewTabOpen(true)}><Plus className="mr-2 h-4 w-4" />Abrir comanda</Button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Em atendimento</p><strong className="text-2xl">{dayTabs.filter((tab) => tab.status === "open" && tab.appointment.status === "in_progress").length}</strong></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Comandas abertas</p><strong className="text-2xl">{dayTabs.filter((tab) => tab.status === "open").length}</strong></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Valor em aberto</p><strong className="text-2xl">{money(openTotal)}</strong></div>
    </div>

    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">{(["in_progress", "open", "paid", "canceled"] as View[]).map((item) => <Button key={item} size="sm" variant={view === item ? "default" : "outline"} onClick={() => setView(item)}>{item === "in_progress" ? "Em atendimento" : item === "open" ? "Abertas" : item === "paid" ? "Finalizadas" : "Canceladas"}</Button>)}</div>
      <div className="relative"><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Data das comandas" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="pl-9" /></div>
    </div>

    {loading ? <div className="grid place-items-center py-16"><Loader2 className="animate-spin" /></div> : filteredTabs.length === 0 ? <div className="rounded-xl border bg-card py-16 text-center"><ReceiptText className="mx-auto mb-3 text-muted-foreground" /><p>Nenhuma comanda nesta visualização.</p></div> : <div className="grid gap-4 xl:grid-cols-2">{filteredTabs.map((tab) => <div key={tab.id} className="overflow-hidden rounded-xl border bg-card">
      <div className="flex justify-between gap-4 border-b p-4"><div><div className="flex flex-wrap items-center gap-2"><strong>{tab.appointment.client.name}</strong><Badge variant={tab.payment?.status === "paid" || tab.payment?.status === "approved" || tab.payment?.status === "covered" ? "default" : "secondary"}>{tab.payment?.status === "covered" ? "Coberto pelo plano" : tab.canFinalize ? "Pago" : "Pagamento pendente"}</Badge></div><p className="text-sm text-muted-foreground">#{tab.id.slice(0, 8).toUpperCase()} · {tab.appointment.barber.displayName} · {new Date(tab.appointment.startAt).toLocaleString("pt-BR")}</p></div><div className="text-right"><strong className="whitespace-nowrap text-xl">{money(tab.amountDue)}</strong><p className="text-xs text-muted-foreground">a receber · {money(tab.total)} em itens</p></div></div>
      <div className="divide-y">{tab.items.length ? tab.items.map((item) => <div key={item.id} className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{item.name}</p>{item.isOriginal && <Badge variant="outline">Item original</Badge>}{!item.isOriginal && <Badge variant="secondary">Pendente</Badge>}</div><p className="text-xs text-muted-foreground">{item.quantity} × {money(item.unitPrice)}{item.responsibleBarber ? ` · Responsável: ${item.responsibleBarber.displayName}` : ""}</p></div><span>{money(item.total)}</span>{tab.status === "open" && <><Button aria-label="Editar item" size="icon" variant="ghost" disabled={busy} onClick={() => beginEdit(tab, item)}><Pencil className="h-4 w-4" /></Button>{!item.isOriginal && <Button aria-label="Remover item" size="icon" variant="ghost" disabled={busy} onClick={() => void act(() => removeServiceTabItem(tab.id, item.id), "Item removido.")}><Trash2 className="h-4 w-4" /></Button>}</>}</div>) : <p className="p-6 text-center text-sm text-muted-foreground">Nenhum item adicionado.</p>}</div>
      {tab.status === "open" && <div className="grid gap-2 border-t p-4 sm:grid-cols-2"><Button variant="outline" onClick={() => beginAdd(tab)}><Plus className="mr-2 h-4 w-4" />Adicionar item</Button><Button variant="outline" onClick={() => navigate(paymentsUrl(tab))}><ReceiptText className="mr-2 h-4 w-4" />Ir para pagamentos</Button><Button variant="destructive" disabled={busy} onClick={() => { if (window.confirm("Cancelar esta comanda e o atendimento?")) void act(() => cancelServiceTab(tab.id), "Comanda cancelada."); }}><XCircle className="mr-2 h-4 w-4" />Cancelar comanda</Button><Button disabled={busy || !tab.canFinalize} title={!tab.canFinalize ? "Confirme o pagamento antes de finalizar" : undefined} onClick={() => void act(() => finalizeServiceTab(tab.id), "Atendimento finalizado.")}><Scissors className="mr-2 h-4 w-4" />Finalizar atendimento</Button>{!tab.canFinalize && <p className="text-xs text-amber-600 sm:col-span-2">A finalização será liberada depois que o pagamento for confirmado.</p>}</div>}
    </div>)}</div>}

    <Dialog open={newTabOpen} onOpenChange={setNewTabOpen}><DialogContent><DialogHeader><DialogTitle>Iniciar atendimento</DialogTitle></DialogHeader><div className="space-y-2">{available.length ? available.map((appointment) => <button key={appointment.id} className="w-full rounded-lg border p-3 text-left hover:bg-muted" disabled={busy} onClick={() => void act(() => openServiceTab(appointment.id), "Atendimento iniciado e comanda aberta.", () => setNewTabOpen(false))}><strong>{appointment.dependent?.name ?? appointment.client?.name ?? "Cliente"}</strong><p className="text-sm text-muted-foreground">{appointment.services.map((service) => service.serviceName).concat(appointment.products.map((product) => product.productName)).join(", ")} · {new Date(appointment.startAt).toLocaleString("pt-BR")}</p></button>) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum atendimento ativo disponível nesta data.</p>}</div></DialogContent></Dialog>

    <Dialog open={Boolean(itemTab)} onOpenChange={(open) => { if (!open) { setItemTab(null); setEditingItem(null); } }}><DialogContent><DialogHeader><DialogTitle>{editingItem ? "Editar item" : "Adicionar item"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={(event) => void saveItem(event)}>
      {!editingItem && <div className="space-y-2"><Label>Tipo</Label><Select value={itemForm.type} onValueChange={(value: ServiceTabItemType) => setItemForm({ ...emptyItem, type: value, responsibleBarberId: itemTab?.appointment.barber.id ?? "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service"><Scissors className="mr-2 inline h-4 w-4" />Serviço</SelectItem><SelectItem value="product"><Package className="mr-2 inline h-4 w-4" />Produto</SelectItem><SelectItem value="consumption"><Coffee className="mr-2 inline h-4 w-4" />Consumo</SelectItem></SelectContent></Select></div>}
      {!editingItem && itemForm.type === "service" && <Select value={itemForm.referenceId} onValueChange={(value) => setItemForm((form) => ({ ...form, referenceId: value }))}><SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger><SelectContent>{services.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} — {money(item.promotionalPrice || item.basePrice)}</SelectItem>)}</SelectContent></Select>}
      {!editingItem && itemForm.type === "product" && <Select value={itemForm.referenceId} onValueChange={(value) => setItemForm((form) => ({ ...form, referenceId: value }))}><SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger><SelectContent>{products.map((item) => <SelectItem key={item.id} value={item.id} disabled={item.stock < 1}>{item.name} — {money(item.price)} ({item.stock} em estoque)</SelectItem>)}</SelectContent></Select>}
      {(itemForm.type === "consumption") && <div className="grid grid-cols-2 gap-3"><div><Label>Descrição</Label><Input value={itemForm.name} onChange={(event) => setItemForm((form) => ({ ...form, name: event.target.value }))} /></div><div><Label>Valor</Label><Input type="number" min="0" step="0.01" value={itemForm.unitPrice} onChange={(event) => setItemForm((form) => ({ ...form, unitPrice: event.target.value }))} /></div></div>}
      <div><Label>Profissional responsável</Label><Select value={itemForm.responsibleBarberId} onValueChange={(value) => setItemForm((form) => ({ ...form, responsibleBarberId: value }))}><SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger><SelectContent>{barbers.map((barber) => <SelectItem key={barber.id} value={barber.id}><UserRound className="mr-2 inline h-4 w-4" />{barber.displayName}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Quantidade</Label><div className="mt-2 flex items-center gap-2"><Button type="button" size="icon" variant="outline" disabled={Boolean(editingItem?.isOriginal)} onClick={() => setItemForm((form) => ({ ...form, quantity: Math.max(1, form.quantity - 1) }))}><Minus /></Button><span className="w-10 text-center">{itemForm.quantity}</span><Button type="button" size="icon" variant="outline" disabled={Boolean(editingItem?.isOriginal)} onClick={() => setItemForm((form) => ({ ...form, quantity: form.quantity + 1 }))}><Plus /></Button></div>{editingItem?.isOriginal && <p className="mt-1 text-xs text-muted-foreground">A quantidade do item original segue o agendamento.</p>}</div>
      <DialogFooter><Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingItem ? "Salvar alterações" : "Adicionar"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </div>;
}
