import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Coffee, Loader2, Minus, Package, Plus, ReceiptText, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAppointments, type Appointment } from "@/service/appointmentService";
import { listProducts, type Product } from "@/service/productService";
import { listServices, type Service } from "@/service/serviceService";
import { addServiceTabItem, listServiceTabs, openServiceTab, payServiceTab, removeServiceTabItem, type ServiceTab, type ServiceTabItemType } from "@/service/serviceTabService";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const message = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error instanceof Error ? error.message : "Não foi possível concluir a operação.");
const emptyItem = { type: "service" as ServiceTabItemType, referenceId: "", name: "", quantity: 1, unitPrice: "" };

export function ServiceTabsPage() {
  const [tabs, setTabs] = useState<ServiceTab[]>([]); const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]); const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [itemTab, setItemTab] = useState<ServiceTab | null>(null); const [payTab, setPayTab] = useState<ServiceTab | null>(null);
  const [newTabOpen, setNewTabOpen] = useState(false); const [itemForm, setItemForm] = useState(emptyItem);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "debito" | "credito" | "dinheiro">("dinheiro");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tabData, appointmentData, serviceData, productData] = await Promise.all([
        listServiceTabs("open"), listAppointments({ status: "confirmed", allAppointments: true, limit: 100 }),
        listServices({ limit: 100 }), listProducts({ active: true }),
      ]);
      setTabs(tabData); setAppointments(appointmentData.items); setServices(serviceData.items.filter((x) => x.active)); setProducts(productData.filter((x) => x.active));
    } catch (error) { toast.error(message(error)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const used = useMemo(() => new Set(tabs.map((tab) => tab.appointmentId)), [tabs]);
  const available = appointments.filter((appointment) => !used.has(appointment.id));
  async function act(action: () => Promise<unknown>, success: string, close: () => void) { setBusy(true); try { await action(); toast.success(success); close(); await load(); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  async function addItem(event: FormEvent) {
    event.preventDefault(); if (!itemTab) return;
    if (itemForm.type !== "consumption" && !itemForm.referenceId) return toast.error("Selecione o item.");
    if (itemForm.type === "consumption" && (!itemForm.name.trim() || Number(itemForm.unitPrice) < 0)) return toast.error("Informe o consumo e o valor.");
    await act(() => addServiceTabItem(itemTab.id, { type: itemForm.type, referenceId: itemForm.referenceId || null, name: itemForm.name || null, quantity: itemForm.quantity, unitPrice: itemForm.type === "consumption" ? Number(itemForm.unitPrice) : null }), "Item adicionado à comanda.", () => { setItemTab(null); setItemForm(emptyItem); });
  }
  return <div className="space-y-6 pb-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold">Comandas</h1><p className="text-sm text-muted-foreground">Gerencie consumos e pagamentos dos atendimentos confirmados.</p></div><Button onClick={() => setNewTabOpen(true)}><Plus className="mr-2 h-4 w-4" />Abrir comanda</Button></div>
    {loading ? <div className="grid place-items-center py-16"><Loader2 className="animate-spin" /></div> : tabs.length === 0 ? <div className="rounded-xl border bg-card py-16 text-center"><ReceiptText className="mx-auto mb-3 text-muted-foreground" /><p>Nenhuma comanda em aberto.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{tabs.map((tab) => <div key={tab.id} className="overflow-hidden rounded-xl border bg-card"><div className="flex justify-between border-b p-4"><div><div className="flex items-center gap-2"><strong>{tab.appointment.client.name}</strong><Badge variant="secondary">Em aberto</Badge></div><p className="text-sm text-muted-foreground">{tab.appointment.barber.displayName} · {new Date(tab.appointment.startAt).toLocaleString("pt-BR")}</p></div><strong className="text-xl">{money(tab.total)}</strong></div><div className="divide-y">{tab.items.length ? tab.items.map((item) => <div key={item.id} className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.quantity} × {money(item.unitPrice)}</p></div><span>{money(item.total)}</span><Button size="icon" variant="ghost" disabled={busy} onClick={() => void act(() => removeServiceTabItem(tab.id, item.id), "Item removido.", () => {})}><Trash2 className="h-4 w-4" /></Button></div>) : <p className="p-6 text-center text-sm text-muted-foreground">Nenhum item adicionado.</p>}</div><div className="flex gap-2 border-t p-4"><Button variant="outline" className="flex-1" onClick={() => setItemTab(tab)}><Plus className="mr-2 h-4 w-4" />Adicionar item</Button><Button className="flex-1" disabled={!tab.items.length} onClick={() => setPayTab(tab)}>Receber</Button></div></div>)}</div>}
    <Dialog open={newTabOpen} onOpenChange={setNewTabOpen}><DialogContent><DialogHeader><DialogTitle>Abrir comanda</DialogTitle></DialogHeader><div className="space-y-2">{available.length ? available.map((appointment) => <button key={appointment.id} className="w-full rounded-lg border p-3 text-left hover:bg-muted" disabled={busy} onClick={() => void act(() => openServiceTab(appointment.id), "Comanda aberta.", () => setNewTabOpen(false))}><strong>{appointment.client?.name ?? "Cliente"}</strong><p className="text-sm text-muted-foreground">{appointment.barber?.displayName} · {new Date(appointment.startAt).toLocaleString("pt-BR")}</p></button>) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum atendimento confirmado disponível.</p>}</div></DialogContent></Dialog>
    <Dialog open={Boolean(itemTab)} onOpenChange={(open) => !open && setItemTab(null)}><DialogContent><DialogHeader><DialogTitle>Adicionar item</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={(e) => void addItem(e)}><div className="space-y-2"><Label>Tipo</Label><Select value={itemForm.type} onValueChange={(value: ServiceTabItemType) => setItemForm({ ...emptyItem, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service"><Scissors className="mr-2 inline h-4 w-4" />Serviço</SelectItem><SelectItem value="product"><Package className="mr-2 inline h-4 w-4" />Produto</SelectItem><SelectItem value="consumption"><Coffee className="mr-2 inline h-4 w-4" />Consumo</SelectItem></SelectContent></Select></div>{itemForm.type === "service" && <Select value={itemForm.referenceId} onValueChange={(v) => setItemForm((f) => ({ ...f, referenceId: v }))}><SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger><SelectContent>{services.map((x) => <SelectItem key={x.id} value={x.id}>{x.name} — {money(x.promotionalPrice || x.basePrice)}</SelectItem>)}</SelectContent></Select>}{itemForm.type === "product" && <Select value={itemForm.referenceId} onValueChange={(v) => setItemForm((f) => ({ ...f, referenceId: v }))}><SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger><SelectContent>{products.map((x) => <SelectItem key={x.id} value={x.id} disabled={x.stock < 1}>{x.name} — {money(x.price)} ({x.stock} em estoque)</SelectItem>)}</SelectContent></Select>}{itemForm.type === "consumption" && <div className="grid grid-cols-2 gap-3"><div><Label>Descrição</Label><Input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} /></div><div><Label>Valor</Label><Input type="number" min="0" step="0.01" value={itemForm.unitPrice} onChange={(e) => setItemForm((f) => ({ ...f, unitPrice: e.target.value }))} /></div></div>}<div><Label>Quantidade</Label><div className="mt-2 flex items-center gap-2"><Button type="button" size="icon" variant="outline" onClick={() => setItemForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}><Minus /></Button><span className="w-10 text-center">{itemForm.quantity}</span><Button type="button" size="icon" variant="outline" onClick={() => setItemForm((f) => ({ ...f, quantity: f.quantity + 1 }))}><Plus /></Button></div></div><DialogFooter><Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(payTab)} onOpenChange={(open) => !open && setPayTab(null)}><DialogContent><DialogHeader><DialogTitle>Receber comanda</DialogTitle></DialogHeader><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Total</p><strong className="text-3xl">{money(payTab?.total ?? 0)}</strong></div><div><Label>Forma de pagamento</Label><Select value={paymentMethod} onValueChange={(v: typeof paymentMethod) => setPaymentMethod(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="pix">PIX</SelectItem><SelectItem value="debito">Débito</SelectItem><SelectItem value="credito">Crédito</SelectItem></SelectContent></Select></div><DialogFooter><Button disabled={busy} onClick={() => payTab && void act(() => payServiceTab(payTab.id, paymentMethod), "Comanda paga e encerrada.", () => setPayTab(null))}>Confirmar pagamento</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
