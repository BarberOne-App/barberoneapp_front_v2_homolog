import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { PlatformPaymentRegistrationModal } from "@/components/PlatformPaymentRegistrationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSuperAdminPlatformSubscriptionSchedule,
  type SuperAdminPlatformSubscriptionScheduleItem,
} from "@/service/superAdminService";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function formatCurrency(value?: number | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, inMonth: date.getMonth() === monthDate.getMonth() };
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Ativa",
    future: "Futura",
    trialing: "Teste",
    pending: "Pendente",
    paused: "Pagamento pendente",
    past_due: "Em atraso",
    expired: "Expirada",
    cancelled: "Cancelada",
  };
  return labels[String(status || "").toLowerCase()] || status;
}

function statusClass(item: SuperAdminPlatformSubscriptionScheduleItem) {
  if (item.daysRemaining < 0 || ["expired", "paused", "past_due"].includes(item.subscriptionStatus)) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  if (item.daysRemaining <= 7 || item.subscriptionStatus === "cancelled") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
}

export function SuperAdminSubscriptionCalendarPage() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [items, setItems] = useState<SuperAdminPlatformSubscriptionScheduleItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<SuperAdminPlatformSubscriptionScheduleItem | null>(null);

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);

  const load = useCallback(async () => {
    const first = new Date(calendarDays[0].date);
    const last = new Date(calendarDays[calendarDays.length - 1].date);
    first.setHours(0, 0, 0, 0);
    last.setHours(23, 59, 59, 999);
    setLoading(true);
    try {
      const result = await getSuperAdminPlatformSubscriptionSchedule({
        from: first.toISOString(),
        to: last.toISOString(),
      });
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch {
      setItems([]);
      toast.error("Não foi possível carregar o calendário de vencimentos.");
    } finally {
      setLoading(false);
    }
  }, [calendarDays]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      item.barbershopName.toLowerCase().includes(term) ||
      item.planName.toLowerCase().includes(term)
    );
  }, [items, search]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, SuperAdminPlatformSubscriptionScheduleItem[]>();
    filteredItems.forEach((item) => {
      const date = new Date(item.dueDate);
      if (Number.isNaN(date.getTime())) return;
      const key = toDateKey(date);
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [filteredItems]);

  const selectedItems = itemsByDay.get(selectedDateKey) ?? [];
  const monthItems = filteredItems.filter((item) => {
    const date = new Date(item.dueDate);
    return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
  });
  const monthTotal = monthItems.reduce((total, item) => total + Number(item.amount || 0), 0);
  const overdueCount = monthItems.filter((item) => item.daysRemaining < 0).length;
  const upcomingCount = monthItems.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7).length;

  function changeMonth(offset: number) {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1);
    setMonthDate(next);
    setSelectedDateKey(toDateKey(next));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Cobranças no mês</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{monthItems.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Valor previsto</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(monthTotal)}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-amber-700">Vencem em até 7 dias</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{upcomingCount}</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <p className="text-sm text-destructive">Em atraso no mês</p>
          <p className="mt-1 text-2xl font-semibold text-destructive">{overdueCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" />
                <h3 className="font-semibold text-foreground">Vencimentos das barbearias</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Datas baseadas na próxima cobrança do plano da plataforma.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar barbearia ou plano" className="h-9 pl-8 sm:w-64" />
              </div>
              <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Atualizar calendário">
                <RefreshCw size={15} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border p-4">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={16} /></Button>
            <h4 className="text-sm font-semibold capitalize text-foreground">{formatMonth(monthDate)}</h4>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)} aria-label="Próximo mês"><ChevronRight size={16} /></Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={18} /> Carregando vencimentos...</div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">{day}</div>)}
                {calendarDays.map(({ date, inMonth }) => {
                  const key = toDateKey(date);
                  const dayItems = itemsByDay.get(key) ?? [];
                  const selected = selectedDateKey === key;
                  const hasOverdue = dayItems.some((item) => item.daysRemaining < 0);
                  return (
                    <button key={key} type="button" onClick={() => setSelectedDateKey(key)} className={`min-h-24 rounded-lg border p-2 text-left transition ${selected ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary/50"} ${inMonth ? "" : "opacity-40"}`}>
                      <div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">{date.getDate()}</span>{hasOverdue && <AlertTriangle size={13} className="text-destructive" />}</div>
                      {dayItems.length > 0 && <div className={`mt-3 rounded px-1.5 py-1 text-xs font-semibold ${hasOverdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{dayItems.length} cobrança(s)</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground">Vencimentos em {selectedDateKey.split("-").reverse().join("/")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{selectedItems.length} assinatura(s) nesta data.</p>
          <div className="mt-4 space-y-3">
            {selectedItems.length === 0 ? (
              <p className="rounded-lg bg-secondary/40 p-4 text-sm text-muted-foreground">Nenhuma cobrança para o dia selecionado.</p>
            ) : selectedItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold text-foreground">{item.barbershopName}</p><p className="text-xs text-muted-foreground">{item.planName}</p></div>
                  <Badge variant="outline" className={statusClass(item)}>{statusLabel(item.subscriptionStatus)}</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Vencimento</p><p className="font-medium text-foreground">{formatDate(item.dueDate)}</p></div>
                  <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                </div>
                <Button className="mt-3 w-full" size="sm" onClick={() => setPaymentTarget(item)}>
                  Registrar pagamento
                </Button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {paymentTarget && (
        <PlatformPaymentRegistrationModal
          barbershopId={paymentTarget.barbershopId}
          barbershopName={paymentTarget.barbershopName}
          currentPlanId={paymentTarget.platformPlanId}
          currentDueDate={paymentTarget.dueDate}
          onClose={() => setPaymentTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
