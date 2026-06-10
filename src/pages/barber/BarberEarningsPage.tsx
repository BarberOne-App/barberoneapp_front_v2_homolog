import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scissors,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyBarber } from "@/hooks/useMyBarber";
import { listAppointments, type Appointment } from "@/service/appointmentService";
import {
  getMyPayrollSummary,
  type EmployeePayment,
  type EmployeePayrollRow,
} from "@/service/employeePayrollService";
import { getHomeInfo } from "@/service/homeInfoService";

/* ─── types ─── */

type PaymentFrequency = "weekly" | "biweekly" | "monthly";

/* ─── period helpers (same logic as V1 getCurrentEarningsPeriodRange) ─── */

function dateToStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeFrequency(raw: string | null | undefined): PaymentFrequency {
  if (raw === "weekly") return "weekly";
  if (raw === "biweekly" || raw === "quinzenal") return "biweekly";
  return "monthly";
}

function getInitialPeriodStart(frequency: PaymentFrequency): Date {
  const now = new Date();
  if (frequency === "weekly") {
    const day = now.getDay(); // 0=Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  }
  if (frequency === "biweekly") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() <= 15 ? 1 : 16);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getPeriodEnd(start: Date, frequency: PaymentFrequency): Date {
  if (frequency === "weekly") {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  }
  if (frequency === "biweekly") {
    // day 1 → end on 15th; day 16 → end on last day of month
    if (start.getDate() === 1) {
      return new Date(start.getFullYear(), start.getMonth(), 15);
    }
    return new Date(start.getFullYear(), start.getMonth() + 1, 0);
  }
  return new Date(start.getFullYear(), start.getMonth() + 1, 0);
}

function goPrevPeriod(start: Date, frequency: PaymentFrequency): Date {
  if (frequency === "weekly") {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7);
  }
  if (frequency === "biweekly") {
    if (start.getDate() === 1) {
      // first half → go to second half of previous month (16th)
      return new Date(start.getFullYear(), start.getMonth() - 1, 16);
    }
    // second half → go to first half of same month (1st)
    return new Date(start.getFullYear(), start.getMonth(), 1);
  }
  return new Date(start.getFullYear(), start.getMonth() - 1, 1);
}

function goNextPeriod(start: Date, frequency: PaymentFrequency): Date {
  if (frequency === "weekly") {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  }
  if (frequency === "biweekly") {
    if (start.getDate() === 1) {
      // first half → go to second half of same month (16th)
      return new Date(start.getFullYear(), start.getMonth(), 16);
    }
    // second half → go to first half of next month (1st)
    return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }
  return new Date(start.getFullYear(), start.getMonth() + 1, 1);
}

function formatPeriodLabel(start: Date, end: Date, frequency: PaymentFrequency): string {
  if (frequency === "monthly") {
    return start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/* ─── misc helpers ─── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getApiMessage(error: unknown): string {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (Array.isArray(responseData)) return responseData.join(" ");
  if (responseData && typeof responseData === "object") {
    const message = (responseData as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return "Erro ao carregar dados.";
}

function isPaidStatus(status: string): boolean {
  return status === "confirmed" || status === "completed";
}

function isCancelledStatus(status: string): boolean {
  return status === "cancelled" || status === "no_show";
}

function statusLabel(status: string): string {
  switch (status) {
    case "scheduled":   return "Agendado";
    case "confirmed":   return "Confirmado";
    case "completed":   return "Finalizado";
    case "cancelled":   return "Cancelado";
    case "no_show":     return "Não compareceu";
    default:            return status;
  }
}

function isExtraPayment(p: EmployeePayment): boolean {
  return (
    p.periodStart === p.periodEnd &&
    Number(p.commission) === 0 &&
    Number(p.totalVales) === 0 &&
    Number(p.salarioFixo) > 0
  );
}

function roundMoney(v: number): number {
  return Math.round((v || 0) * 100) / 100;
}

// V1 uses services total only — products are NOT included in commission base
function calcServicesTotal(apt: Appointment): number {
  return apt.services.reduce((sum, s) => sum + (s.totalPrice ?? 0), 0);
}

interface EarningsStats {
  pendingRevenue: number;
  paidRevenue: number;
  totalRevenue: number;
  pendingBarberEarnings: number;
  paidBarberEarnings: number;
  totalBarberEarnings: number;
  shopEarnings: number;
  appointmentsCount: number;
  commissionPercent: number;
  barberEarnings: number;
  filteredAppointments: Appointment[];
  extraPayments: EmployeePayment[];
  payrollPayments: EmployeePayment[];
  extraPaymentsTotal: number;
  payrollPaymentsTotal: number;
  totalReceivedPayments: number;
}

/* ─── component ─── */

export function BarberEarningsPage() {
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [periodStart, setPeriodStart] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [row, setRow] = useState<EmployeePayrollRow | null>(null);
  const [loading, setLoading] = useState(false);

  const { barber, loading: barberLoading } = useMyBarber();

  const periodEnd = getPeriodEnd(periodStart, frequency);
  const periodStartStr = dateToStr(periodStart);
  const periodEndStr = dateToStr(periodEnd);

  // Load barber_payment_frequency once; adjust initial period to match V1 behavior
  useEffect(() => {
    getHomeInfo()
      .then((homeInfo) => {
        const freq = normalizeFrequency(homeInfo.barber_payment_frequency);
        setFrequency(freq);
        setPeriodStart(getInitialPeriodStart(freq));
      })
      .catch(() => {
        // keep default monthly
      });
  }, []);

  const load = useCallback(async () => {
    if (!barber) return;
    setLoading(true);
    try {
      const [appointmentsRes, summaryRes] = await Promise.all([
        listAppointments({
          barberId: barber.id,
          dateFrom: periodStartStr,
          dateTo: periodEndStr,
          allAppointments: true,
          limit: 100,
        }),
        getMyPayrollSummary({ periodStart: periodStartStr, periodEnd: periodEndStr }),
      ]);
      setAppointments(appointmentsRes.items);
      setRow(summaryRes.items[0] ?? null);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [barber, periodStartStr, periodEndStr]);

  useEffect(() => {
    void load();
  }, [load]);

  const isCurrentPeriod =
    dateToStr(periodStart) === dateToStr(getInitialPeriodStart(frequency));

  function prevPeriod() {
    setPeriodStart((prev) => goPrevPeriod(prev, frequency));
  }

  function nextPeriod() {
    if (isCurrentPeriod) return;
    setPeriodStart((prev) => goNextPeriod(prev, frequency));
  }

  const stats = useMemo((): EarningsStats => {
    let pendingRevenue = 0;
    let paidRevenue = 0;
    let pendingBarberEarnings = 0;
    let paidBarberEarnings = 0;
    let appointmentsCount = 0;

    for (const apt of appointments) {
      // V1 inclui todos os atendimentos do período (inclusive cancelados/no_show) no cálculo.
      // Cancelados vão para o bucket "pendente", como no V1 (isConfirmedStatus = false → pendingRevenue).
      appointmentsCount++;
      const total = calcServicesTotal(apt);
      const commission = apt.commissionAmount ?? 0;

      if (isPaidStatus(apt.status)) {
        paidRevenue += total;
        paidBarberEarnings += commission;
      } else {
        pendingRevenue += total;
        pendingBarberEarnings += commission;
      }
    }

    const totalRevenue = roundMoney(pendingRevenue + paidRevenue);
    const totalBarberEarnings = roundMoney(pendingBarberEarnings + paidBarberEarnings);
    const shopEarnings = roundMoney(Math.max(paidRevenue - paidBarberEarnings, 0));

    const allPayments: EmployeePayment[] = row?.payments ?? [];
    const extraPayments = allPayments.filter(isExtraPayment);
    const payrollPayments = allPayments.filter((p) => !isExtraPayment(p));
    const extraPaymentsTotal = roundMoney(
      extraPayments.reduce((sum, p) => sum + Number(p.liquido || 0), 0)
    );
    const payrollPaymentsTotal = roundMoney(
      payrollPayments.reduce((sum, p) => sum + Number(p.liquido || 0), 0)
    );
    const totalReceivedPayments = roundMoney(extraPaymentsTotal + payrollPaymentsTotal);

    const commissionPercent = barber?.commissionPercent ?? 50;

    // V1 exibe todos os atendimentos do período (inclusive cancelados)
    const filteredAppointments = [...appointments]
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return {
      pendingRevenue: roundMoney(pendingRevenue),
      paidRevenue: roundMoney(paidRevenue),
      totalRevenue,
      pendingBarberEarnings: roundMoney(pendingBarberEarnings),
      paidBarberEarnings: roundMoney(paidBarberEarnings),
      totalBarberEarnings,
      shopEarnings,
      appointmentsCount,
      commissionPercent,
      barberEarnings: roundMoney(paidBarberEarnings),
      filteredAppointments,
      extraPayments,
      payrollPayments,
      extraPaymentsTotal,
      payrollPaymentsTotal,
      totalReceivedPayments,
    };
  }, [appointments, row, barber]);

  const hasData =
    stats.appointmentsCount > 0 ||
    stats.extraPayments.length > 0 ||
    stats.payrollPayments.length > 0;

  const isPageLoading = barberLoading || loading;

  return (
    <div className="space-y-6">
      {/* Navegação de período */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">Período</p>
          <p className="text-lg font-semibold text-foreground">
            {formatPeriodLabel(periodStart, periodEnd, frequency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {periodStartStr} a {periodEndStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPeriod}>
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPeriod}
            disabled={isCurrentPeriod}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {isPageLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : !hasData ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum dado encontrado para este período.
        </div>
      ) : (
        <>
          {/* 4 cards de resumo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="mt-1 text-xl font-bold text-red-500">
                {formatCurrency(stats.pendingBarberEarnings)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="mt-1 text-xl font-bold text-emerald-500">
                {formatCurrency(stats.paidBarberEarnings)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {formatCurrency(stats.totalBarberEarnings)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Barbearia</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {formatCurrency(stats.shopEarnings)}
              </p>
            </div>
          </div>

          {/* Card de estatísticas do barbeiro */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-4 border-b border-border px-5 py-4">
              {barber?.photoUrl ? (
                <img
                  src={barber.photoUrl}
                  alt={barber.displayName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User size={20} className="text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{barber?.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {barber?.specialty ?? "Barbeiro"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-4">
              {(
                [
                  { label: "Atendimentos", value: String(stats.appointmentsCount) },
                  { label: "Faturamento Total", value: formatCurrency(stats.totalRevenue) },
                  {
                    label: `Seus Ganhos (${stats.commissionPercent}%)`,
                    value: formatCurrency(stats.barberEarnings),
                    highlight: true,
                  },
                  { label: "Pag. extras", value: formatCurrency(stats.extraPaymentsTotal) },
                  { label: "Folha recebida", value: formatCurrency(stats.payrollPaymentsTotal) },
                  { label: "Barbearia", value: formatCurrency(stats.shopEarnings) },
                  {
                    label: "Total recebido",
                    value: formatCurrency(stats.totalReceivedPayments),
                    bold: true,
                  },
                ] as Array<{ label: string; value: string; highlight?: boolean; bold?: boolean }>
              ).map(({ label, value, highlight, bold }) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p
                    className={`mt-0.5 text-sm font-semibold ${
                      highlight
                        ? "text-emerald-500"
                        : bold
                          ? "text-primary"
                          : "text-foreground"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de agendamentos */}
          {stats.filteredAppointments.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Scissors size={18} className="text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Agendamentos do período
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Data</th>
                      <th className="px-4 py-3 text-left font-medium">Horário</th>
                      <th className="px-4 py-3 text-left font-medium">Serviços</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-right font-medium">Seus Ganhos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.filteredAppointments.map((apt) => {
                      const aptTotal = calcServicesTotal(apt);
                      const commission = apt.commissionAmount ?? 0;
                      const paid = isPaidStatus(apt.status);
                      const serviceNames = apt.services.map((s) => s.serviceName).join(", ");

                      return (
                        <tr key={apt.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <Badge
                              variant={paid ? "default" : "secondary"}
                              className={
                                paid
                                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0"
                                  : ""
                              }
                            >
                              {statusLabel(apt.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {apt.client?.name ?? apt.dependent?.name ?? "Cliente"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(apt.startAt)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatTime(apt.startAt)}
                          </td>
                          <td
                            className="max-w-[180px] truncate px-4 py-3 text-muted-foreground"
                            title={serviceNames}
                          >
                            {serviceNames || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {formatCurrency(aptTotal)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              paid ? "text-emerald-500" : "text-red-500"
                            }`}
                          >
                            {formatCurrency(commission)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela de pagamentos extras */}
          {stats.extraPayments.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Pagamentos extras do período
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium">Data</th>
                      <th className="px-4 py-3 text-right font-medium">Valor</th>
                      <th className="px-4 py-3 text-left font-medium">Registrado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.extraPayments.map((payment) => (
                      <tr key={payment.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium text-foreground">
                          Pagamento Extra
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(payment.paidAt || payment.periodStart)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-500">
                          {formatCurrency(Number(payment.liquido || 0))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {payment.paidByName ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela de pagamentos de folha */}
          {stats.payrollPayments.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Pagamentos de folha do período
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">Data Pgto.</th>
                      <th className="px-4 py-3 text-left font-medium">Período</th>
                      <th className="px-4 py-3 text-right font-medium">Salário</th>
                      <th className="px-4 py-3 text-right font-medium">Comissão</th>
                      <th className="px-4 py-3 text-right font-medium">Vales</th>
                      <th className="px-4 py-3 text-right font-medium">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...stats.payrollPayments]
                      .sort(
                        (a, b) =>
                          new Date(b.paidAt ?? 0).getTime() -
                          new Date(a.paidAt ?? 0).getTime()
                      )
                      .map((payment) => (
                        <tr key={payment.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(payment.paidAt)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {payment.periodStart?.split("-").reverse().join("/")}{" "}
                            →{" "}
                            {payment.periodEnd?.split("-").reverse().join("/")}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            {formatCurrency(Number(payment.salarioFixo || 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            {formatCurrency(Number(payment.commission || 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-destructive">
                            − {formatCurrency(Number(payment.totalVales || 0))}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-500">
                            {formatCurrency(Number(payment.liquido || 0))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
