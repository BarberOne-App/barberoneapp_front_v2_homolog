import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Calendar,
  CalendarCheck,
  Loader2,
  Scissors,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import AdminAppointmentsCalendar from "@/components/AdminAppointmentsCalendar";
import { AppCalendar } from "@/components/AppCalendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointment,
  listAppointments,
  type Appointment,
} from "@/service/appointmentService";
import { listBarbers, type Barber } from "@/service/barberService";
import { listServices, type Service } from "@/service/serviceService";
import { listUsers, type UserProfile } from "@/service/userService";
import {
  buildCalendarAppointmentsByBarber,
  buildCalendarFreeSlotsByBarber,
  buildCalendarTimeSlots,
  CALENDAR_END_MINUTES,
  CALENDAR_FIT_SLOT_MAX_MINUTES,
  CALENDAR_MINUTES_PER_SLOT,
  CALENDAR_SLOT_HEIGHT,
  CALENDAR_START_MINUTES,
  getLocalDateKey,
  getStableCalendarColor,
  minutesToTime,
  type CalendarColor,
} from "@/utils/adminCalendar";
import { buildFitNotes } from "@/utils/fitAppointment";

/* ── helpers ── */

function getApiMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (Array.isArray(data)) return data.join(" ");
  if (data && typeof data === "object") {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  if (error instanceof Error) return error.message;
  return "Nao foi possivel concluir a operacao.";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getTodaySaoPaulo(): Date {
  const now = new Date();
  const sp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = sp.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function getCurrentSaoPauloMinutes(): number {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [h, m] = formatted.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/* ── FitBookingDialog ── */

interface FitSlotInfo {
  barberId: string;
  barberName: string;
  date: Date;
  startMinutes: number;
  durationMinutes: number;
}

interface FitBookingDialogProps {
  slotInfo: FitSlotInfo;
  onClose: () => void;
  onSuccess: () => void;
}

function FitBookingDialog({ slotInfo, onClose, onSuccess }: FitBookingDialogProps) {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState(minutesToTime(slotInfo.startMinutes));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cr, sr] = await Promise.all([
          listUsers({ role: "client", page: 1, limit: 100 }),
          listServices({ includeInactive: false, page: 1, limit: 100 }),
        ]);
        setCustomers(cr.items);
        setServices(sr.items.filter((s) => s.active));
      } catch (err) {
        toast.error(getApiMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const selectedServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds],
  );
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.durationMinutes ?? 30), 0),
    [selectedServices],
  );
  const durationExceeds = totalDuration > 0 && totalDuration > slotInfo.durationMinutes;
  const dateKey = getLocalDateKey(slotInfo.date);

  function toggleService(id: string, checked: boolean) {
    setServiceIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId) { toast.error("Selecione o cliente."); return; }
    if (serviceIds.length === 0) { toast.error("Selecione pelo menos um servico."); return; }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) { toast.error("Informe o horario no formato HH:MM."); return; }

    setSaving(true);
    try {
      await createAppointment({
        barberId: slotInfo.barberId,
        clientId,
        date: dateKey,
        time,
        notes: buildFitNotes(notes),
        allowOutsideBusinessHours: false,
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          basePrice: s.basePrice,
          durationMinutes: s.durationMinutes,
          quantity: 1,
        })),
        products: [],
      });
      toast.success("Encaixe criado com sucesso.");
      onSuccess();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Criar Encaixe</DialogTitle>
            <DialogDescription>
              {slotInfo.barberName}
              {" · "}
              {slotInfo.date.toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
              {" · "}
              {minutesToTime(slotInfo.startMinutes)} — {minutesToTime(slotInfo.startMinutes + slotInfo.durationMinutes)}
              {" "}({slotInfo.durationMinutes} min disponíveis)
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fit-time">
                Horario de inicio
                <span className="ml-1 text-xs text-muted-foreground">
                  (ate {minutesToTime(slotInfo.startMinutes + slotInfo.durationMinutes)})
                </span>
              </Label>
              <Input
                id="fit-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? "Carregando..." : "Selecionar cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Servicos
              {totalDuration > 0 && (
                <span
                  className={`ml-2 text-xs ${
                    durationExceeds ? "font-medium text-amber-500" : "text-muted-foreground"
                  }`}
                >
                  {totalDuration} min{durationExceeds ? " — excede o intervalo" : ""}
                </span>
              )}
            </Label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border p-3 space-y-1">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando servicos...</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum servico ativo.</p>
              ) : (
                services.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2 text-sm hover:bg-secondary/60"
                  >
                    <Checkbox
                      checked={serviceIds.includes(service.id)}
                      onCheckedChange={(checked) => toggleService(service.id, checked === true)}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{service.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {Number(service.durationMinutes ?? 30)} min — {formatCurrency(service.basePrice)}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fit-notes">Observacoes</Label>
            <Textarea
              id="fit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Salvando</>
              ) : (
                "Criar Encaixe"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── FitAppointmentPage ── */

export function FitAppointmentPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(getTodaySaoPaulo);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [fitSlot, setFitSlot] = useState<FitSlotInfo | null>(null);

  const activeDateKey = getLocalDateKey(selectedDate);
  const isToday = activeDateKey === getLocalDateKey(getTodaySaoPaulo());

  /* Horário atual em minutos — atualiza a cada minuto quando é hoje */
  const [nowMinutes, setNowMinutes] = useState<number | null>(
    () => (activeDateKey === getLocalDateKey(getTodaySaoPaulo()) ? getCurrentSaoPauloMinutes() : null),
  );

  useEffect(() => {
    if (!isToday) {
      setNowMinutes(null);
      return;
    }
    setNowMinutes(getCurrentSaoPauloMinutes());
    const interval = setInterval(() => {
      setNowMinutes(getCurrentSaoPauloMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  /* Load barbers once */
  useEffect(() => {
    listBarbers({ page: 1, limit: 100 })
      .then((r) => setBarbers(r.items))
      .catch((err) => toast.error(getApiMessage(err)))
      .finally(() => setLoadingBarbers(false));
  }, []);

  /* Load appointments when date changes */
  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const result = await listAppointments({
        allAppointments: true,
        dateFrom: activeDateKey,
        dateTo: activeDateKey,
        limit: 100,
        page: 1,
      });
      setAppointments(result.items);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setLoadingAppointments(false);
    }
  }, [activeDateKey]);

  useEffect(() => { void loadAppointments(); }, [loadAppointments]);

  const barberColors = useMemo(() => {
    const map = new Map<string, CalendarColor>();
    barbers.forEach((b, i) => map.set(b.id, getStableCalendarColor(b, i)));
    return map;
  }, [barbers]);

  const getAppointmentStartDate = useCallback((apt: Appointment): Date | null => {
    const raw = (apt as any).startAt || (apt as any).start_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, []);

  const appointmentsByBarber = useMemo(
    () => buildCalendarAppointmentsByBarber({
      appointments, barbers, activeDateKey, barberColors, getAppointmentStartDate,
    }),
    [appointments, barbers, activeDateKey, barberColors, getAppointmentStartDate],
  );

  const freeSlotsByBarber = useMemo(
    () => buildCalendarFreeSlotsByBarber({
      barbers, appointmentsByBarber,
      startMinutes: CALENDAR_START_MINUTES, endMinutes: CALENDAR_END_MINUTES,
      minutesPerSlot: CALENDAR_MINUTES_PER_SLOT, fitSlotMaxMinutes: CALENDAR_FIT_SLOT_MAX_MINUTES,
      nowMinutes,
    }),
    [barbers, appointmentsByBarber, nowMinutes],
  );

  const timeSlots = useMemo(() => buildCalendarTimeSlots(), []);
  const bodyHeight =
    ((CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) / CALENDAR_MINUTES_PER_SLOT) *
    CALENDAR_SLOT_HEIGHT;

  const totalFreeSlots = useMemo(() => {
    let n = 0;
    freeSlotsByBarber.forEach((s) => { n += s.length; });
    return n;
  }, [freeSlotsByBarber]);

  const activeAptCount = useMemo(
    () => appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length,
    [appointments],
  );

  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status === "confirmed").length,
    [appointments],
  );

  function handleFreeFitBooking(barberId: string, date: Date, startMins: number, durationMins: number) {
    const barber = barbers.find((b) => b.id === barberId);
    setFitSlot({
      barberId,
      barberName: barber?.displayName ?? "Barbeiro",
      date,
      startMinutes: startMins,
      durationMinutes: durationMins,
    });
  }

  const activeDateLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Agendamentos</p>
            <h3 className="text-2xl font-semibold text-foreground">
              {loadingAppointments ? <Loader2 size={18} className="animate-spin" /> : activeAptCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isToday ? "hoje" : formatDateShort(selectedDate)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Zap size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Encaixes livres</p>
            <h3 className="text-2xl font-semibold text-foreground">
              {loadingAppointments ? <Loader2 size={18} className="animate-spin" /> : totalFreeSlots}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isToday ? "hoje" : formatDateShort(selectedDate)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <CalendarCheck size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Confirmados</p>
            <h3 className="text-2xl font-semibold text-foreground">
              {loadingAppointments ? <Loader2 size={18} className="animate-spin" /> : confirmedCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isToday ? "hoje" : formatDateShort(selectedDate)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Users size={18} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Barbeiros</p>
            <h3 className="text-2xl font-semibold text-foreground">
              {loadingBarbers ? <Loader2 size={18} className="animate-spin" /> : barbers.length}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Calendar card ── */}
      {/*
        overflow-visible no wrapper para não clipar o Popover do AppCalendar.
        overflow-hidden é aplicado apenas no body (abaixo do header).
      */}
      <div className="bg-card rounded-xl border border-border">
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b border-border lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <h3 className="text-base font-medium text-foreground">Encaixe de Agendamento</h3>
            {loadingAppointments && (
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Legenda */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-3 w-5 shrink-0 rounded"
                  style={{
                    border: '1.5px dashed rgba(16,185,129,0.6)',
                    background: 'rgba(16,185,129,0.07)',
                  }}
                />
                <span className="text-emerald-500">Encaixe livre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-3 w-5 shrink-0 rounded"
                  style={{
                    border: '1px solid rgba(56,189,248,0.28)',
                    borderLeft: '3px solid #38bdf8',
                    background: 'rgba(8,47,73,0.90)',
                  }}
                />
                <span>Agendamento</span>
              </div>
            </div>

            {/* Seletor de data */}
            <AppCalendar
              value={selectedDate}
              onChange={(d) => d && setSelectedDate(d)}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 1}
              className="h-9 w-auto min-w-[160px] rounded-lg"
            />
          </div>
        </div>

        {/* Body — overflow-hidden aqui para conter o scroll do grid sem clipar o header */}
        <div className="overflow-hidden rounded-b-xl">

        {/* Loading */}
        {(loadingBarbers || loadingAppointments) && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Carregando agenda...
            </span>
          </div>
        )}

        {/* Empty: no barbers */}
        {!loadingBarbers && !loadingAppointments && barbers.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <div className="inline-flex flex-col items-center gap-3">
              <Scissors size={36} className="opacity-20" />
              <span>Nenhum barbeiro cadastrado.</span>
            </div>
          </div>
        )}

        {/* Calendar grid */}
        {!loadingBarbers && !loadingAppointments && barbers.length > 0 && (
          <AdminAppointmentsCalendar
            activeDateLabel={activeDateLabel}
            activeDateKey={activeDateKey}
            appointmentDateFilter={selectedDate}
            barbers={barbers}
            barberColors={barberColors}
            timeSlots={timeSlots}
            appointmentsByBarber={appointmentsByBarber}
            freeSlotsByBarber={freeSlotsByBarber}
            bodyHeight={bodyHeight}
            slotHeight={CALENDAR_SLOT_HEIGHT}
            minutesPerSlot={CALENDAR_MINUTES_PER_SLOT}
            startMinutes={CALENDAR_START_MINUTES}
            nowMinutes={nowMinutes}
            onFreeFitBooking={handleFreeFitBooking}
            getAppointmentStartDate={getAppointmentStartDate}
          />
        )}

        </div>{/* fim overflow-hidden rounded-b-xl */}
      </div>

      {/* Fit booking dialog */}
      {fitSlot && (
        <FitBookingDialog
          slotInfo={fitSlot}
          onClose={() => setFitSlot(null)}
          onSuccess={async () => {
            setFitSlot(null);
            await loadAppointments();
          }}
        />
      )}
    </div>
  );
}
