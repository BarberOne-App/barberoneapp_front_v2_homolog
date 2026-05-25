import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  createBlockedDate,
  deleteBlockedDate,
  listBlockedDates,
  updateBlockedDate,
  type BlockedDate,
  type BlockedDatePayload,
} from "@/service/blockedDateService";
import { listBarbers, type Barber } from "@/service/barberService";

interface Schedule {
  id: number;
  staffName: string;
  day: string;
  startTime: string;
  endTime: string;
  breaks: string;
  status: "trabalhando" | "off" | "ferias";
  avatar: string;
}

interface BlockedDateFormState {
  date: string;
  reason: string;
  blockType: "all" | "barber";
  barberId: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
}

const schedules: Schedule[] = [
  {
    id: 1,
    staffName: "Rodrigues",
    day: "Monday",
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    breaks: "12:00 - 01:00 PM",
    status: "trabalhando",
    avatar: "https://i.pravatar.cc/150?u=lucas",
  },
  {
    id: 2,
    staffName: "Pedro",
    day: "Monday",
    startTime: "10:00 AM",
    endTime: "07:00 PM",
    breaks: "01:00 - 02:00 PM",
    status: "trabalhando",
    avatar: "https://i.pravatar.cc/150?u=daniel",
  },
];

const days = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

const emptyBlockedDateForm: BlockedDateFormState = {
  date: dateToDateString(new Date()),
  reason: "",
  blockType: "all",
  barberId: "",
  allDay: true,
  startTime: "09:00",
  endTime: "18:00",
};

function dateToDateString(date?: Date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value || "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getApiMessage(error: unknown) {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (Array.isArray(responseData)) return responseData.join(" ");

  if (responseData && typeof responseData === "object") {
    const message = (responseData as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  if (error instanceof Error) return error.message;
  return "Nao foi possivel concluir a operacao.";
}

function blockedDateToForm(item: BlockedDate): BlockedDateFormState {
  return {
    date: item.date,
    reason: item.reason ?? "",
    blockType: item.barberId ? "barber" : "all",
    barberId: item.barberId ?? "",
    allDay: !item.startTime || !item.endTime,
    startTime: item.startTime ?? "09:00",
    endTime: item.endTime ?? "18:00",
  };
}

function buildPayload(form: BlockedDateFormState): BlockedDatePayload {
  return {
    date: form.date,
    reason: form.reason.trim() || null,
    barberId: form.blockType === "barber" ? form.barberId : null,
    startTime: form.allDay ? null : form.startTime,
    endTime: form.allDay ? null : form.endTime,
  };
}

export function SchedulesPage() {
  const [selectedDay, setSelectedDay] = useState("Segunda");
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [search, setSearch] = useState("");
  const [loadingBlockedDates, setLoadingBlockedDates] = useState(true);
  const [savingBlockedDate, setSavingBlockedDate] = useState(false);
  const [blockedDateDialogOpen, setBlockedDateDialogOpen] = useState(false);
  const [editingBlockedDate, setEditingBlockedDate] = useState<BlockedDate | null>(null);
  const [form, setForm] = useState<BlockedDateFormState>(emptyBlockedDateForm);

  const loadBlockedDates = useCallback(async () => {
    try {
      setLoadingBlockedDates(true);
      const [blockedDatesData, barbersData] = await Promise.all([
        listBlockedDates(),
        listBarbers({ limit: 100 }),
      ]);
      setBlockedDates(blockedDatesData);
      setBarbers(barbersData.items);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setLoadingBlockedDates(false);
    }
  }, []);

  useEffect(() => {
    loadBlockedDates();
  }, [loadBlockedDates]);

  const filteredBlockedDates = useMemo(() => {
    const term = normalizeText(search.trim());
    if (!term) return blockedDates;

    return blockedDates.filter((item) => {
      const values = [
        formatDate(item.date),
        item.reason ?? "",
        item.barber?.displayName ?? "Todos",
        item.startTime && item.endTime ? `${item.startTime} ${item.endTime}` : "Dia inteiro",
      ];

      return values.some((value) => normalizeText(value).includes(term));
    });
  }, [blockedDates, search]);

  function openCreateDialog() {
    setEditingBlockedDate(null);
    setForm(emptyBlockedDateForm);
    setBlockedDateDialogOpen(true);
  }

  function openEditDialog(item: BlockedDate) {
    setEditingBlockedDate(item);
    setForm(blockedDateToForm(item));
    setBlockedDateDialogOpen(true);
  }

  async function handleSubmitBlockedDate(event: FormEvent) {
    event.preventDefault();

    if (!form.date) {
      toast.error("Informe a data bloqueada.");
      return;
    }

    if (form.blockType === "barber" && !form.barberId) {
      toast.error("Selecione o funcionario afetado.");
      return;
    }

    if (!form.allDay && (!form.startTime || !form.endTime || form.startTime >= form.endTime)) {
      toast.error("Informe um intervalo de horario valido.");
      return;
    }

    try {
      setSavingBlockedDate(true);
      const payload = buildPayload(form);

      if (editingBlockedDate) {
        await updateBlockedDate(editingBlockedDate.id, payload);
        toast.success("Data bloqueada atualizada.");
      } else {
        await createBlockedDate(payload);
        toast.success("Data bloqueada adicionada.");
      }

      setBlockedDateDialogOpen(false);
      await loadBlockedDates();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setSavingBlockedDate(false);
    }
  }

  async function handleDeleteBlockedDate(item: BlockedDate) {
    const confirmed = window.confirm("Remover esta data bloqueada?");
    if (!confirmed) return;

    try {
      await deleteBlockedDate(item.id);
      toast.success("Data bloqueada removida.");
      await loadBlockedDates();
    } catch (err) {
      toast.error(getApiMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Funcionarios</p>
          <h3 className="text-2xl font-semibold text-foreground">6</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Trabalhando hoje</p>
          <h3 className="text-2xl font-semibold text-foreground">5</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Online</p>
          <h3 className="text-2xl font-semibold text-foreground">1</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Datas Bloqueadas</p>
          <h3 className="text-2xl font-semibold text-foreground">{blockedDates.length}</h3>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm">
            <ChevronLeft size={16} />
          </Button>
          <div className="flex gap-2 overflow-x-auto">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-border lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-medium text-foreground">Calendario - {selectedDay}</h3>
            <Badge variant="secondary">06 de Abril de 2026</Badge>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search staff..."
                className="w-full sm:w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filtro
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Adicionar Horario
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hora de Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hora de Termino</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Intervalos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={schedule.avatar} alt={schedule.staffName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {schedule.staffName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{schedule.staffName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock size={14} className="text-muted-foreground" />
                      {schedule.startTime}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock size={14} className="text-muted-foreground" />
                      {schedule.endTime}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      {schedule.breaks}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                        schedule.status === "trabalhando"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : schedule.status === "ferias"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                      }`}
                    >
                      {schedule.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-border lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">Datas Bloqueadas</h3>
            <p className="text-sm text-muted-foreground">Indisponibilidades da barbearia ou de funcionarios especificos.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar bloqueios..."
                className="w-full sm:w-64 bg-secondary pl-9"
              />
            </div>
            <Button size="sm" className="gap-2" onClick={openCreateDialog}>
              <Plus size={14} />
              Adicionar Data Bloqueada
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Motivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Horario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loadingBlockedDates ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando datas bloqueadas...
                    </span>
                  </td>
                </tr>
              ) : filteredBlockedDates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma data bloqueada encontrada.
                  </td>
                </tr>
              ) : (
                filteredBlockedDates.map((item) => {
                  const isAllDay = !item.startTime || !item.endTime;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.reason || "Sem motivo informado"}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {item.barberId ? "Funcionario especifico" : "Barbearia inteira"}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{item.barber?.displayName ?? "Todos"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Clock size={14} className="text-muted-foreground" />
                          {isAllDay ? "Dia inteiro" : `${item.startTime} - ${item.endTime}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs px-2 py-0.5 rounded-full">
                          Bloqueado
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit size={14} />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteBlockedDate(item)}>
                              <Trash2 size={14} />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={blockedDateDialogOpen} onOpenChange={setBlockedDateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBlockedDate ? "Editar Data Bloqueada" : "Adicionar Data Bloqueada"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitBlockedDate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blocked-date">Data</Label>
                <Input
                  id="blocked-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de bloqueio</Label>
                <Select
                  value={form.blockType}
                  onValueChange={(value: "all" | "barber") =>
                    setForm((current) => ({
                      ...current,
                      blockType: value,
                      barberId: value === "all" ? "" : current.barberId,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barbearia inteira</SelectItem>
                    <SelectItem value="barber">Funcionario especifico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.blockType === "barber" && (
              <div className="space-y-2">
                <Label>Funcionario afetado</Label>
                <Select
                  value={form.barberId}
                  onValueChange={(value) => setForm((current) => ({ ...current, barberId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="blocked-reason">Motivo</Label>
              <Textarea
                id="blocked-reason"
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Ex: feriado, manutencao, folga do funcionario"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2">
              <Checkbox
                id="blocked-all-day"
                checked={form.allDay}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, allDay: checked === true }))}
              />
              <Label htmlFor="blocked-all-day" className="text-sm font-normal">
                Dia inteiro
              </Label>
            </div>

            {!form.allDay && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="blocked-start-time">Hora inicial</Label>
                  <Input
                    id="blocked-start-time"
                    type="time"
                    value={form.startTime}
                    onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                    required={!form.allDay}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blocked-end-time">Hora final</Label>
                  <Input
                    id="blocked-end-time"
                    type="time"
                    value={form.endTime}
                    onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                    required={!form.allDay}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBlockedDateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingBlockedDate} className="gap-2">
                {savingBlockedDate && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
