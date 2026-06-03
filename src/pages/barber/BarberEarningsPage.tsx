import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scissors,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listAppointments } from "@/service/appointmentService";
import { getMyPayrollSummary, type EmployeePayrollRow } from "@/service/employeePayrollService";
import { useMyBarber } from "@/hooks/useMyBarber";

/* ─── helpers ─── */

function dateToStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: dateToStr(start), end: dateToStr(end) };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
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

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function isExtraPayment(p: EmployeePayrollRow["payments"][number]): boolean {
  return (
    p.periodStart === p.periodEnd &&
    Number(p.commission) === 0 &&
    Number(p.salarioFixo) > 0
  );
}

/* ─── component ─── */

export function BarberEarningsPage() {
  const { barber, loading: barberLoading } = useMyBarber();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [row, setRow] = useState<EmployeePayrollRow | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  const { start: periodStart, end: periodEnd } = getMonthRange(year, month);

  const load = useCallback(async (barberId: string) => {
    setLoading(true);
    try {
      const [summaryRes, apptRes] = await Promise.all([
        getMyPayrollSummary({ periodStart, periodEnd }),
        listAppointments({
          barberId,
          dateFrom: periodStart,
          dateTo: periodEnd,
          allAppointments: true,
          limit: 100,
        }),
      ]);

      const myRow = summaryRes.items[0] ?? null;
      setRow(myRow);

      const revenue = apptRes.items
        .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
        .reduce((sum, a) => sum + (a.totalAmount ?? 0), 0);
      setTotalRevenue(revenue);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    if (barber?.id) void load(barber.id);
  }, [barber, load]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const stats = useMemo(() => {
    if (!row) return null;

    const commissionPercent = barber?.commissionPercent ?? null;
    const extraPago = row.paymentHistory
      .filter(isExtraPayment)
      .reduce((sum, p) => sum + Number(p.salarioFixo || 0), 0);
    const folhaPago = row.paymentHistory
      .filter((p) => !isExtraPayment(p))
      .reduce((sum, p) => sum + Number(p.liquido || p.netAmount || 0), 0);
    const barbearia = Math.max(totalRevenue - row.commission, 0);

    return {
      atendimentos: row.appointmentsCount,
      totalRevenue,
      commissionPercent,
      commission: row.commission,
      extraPago,
      folhaPago,
      barbearia,
      totalRecebido: row.paidAmount,
      amountDue: row.amountDue,
    };
  }, [row, barber, totalRevenue]);

  if (barberLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">Periodo</p>
          <p className="text-lg font-semibold text-foreground">
            {MONTH_NAMES[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : !stats ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum dado encontrado para este periodo.
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Scissors size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atendimentos</p>
                <p className="text-3xl font-bold text-foreground">{stats.atendimentos}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {MONTH_NAMES[month]} {year}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Soma dos atendimentos</p>
              </div>
            </div>
          </div>

          {/* Breakdown card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-primary" />
                <h3 className="text-base font-semibold text-foreground">Resumo de Ganhos</h3>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {MONTH_NAMES[month]} {year} · {periodStart} a {periodEnd}
              </p>
            </div>

            <div className="divide-y divide-border">
              {/* Commission */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Comissão
                    {stats.commissionPercent !== null && stats.commissionPercent !== undefined && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {stats.commissionPercent}%
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Sobre os atendimentos do periodo</p>
                </div>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(stats.commission)}
                </p>
              </div>

              {/* Pag. extras */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Pag. extras</p>
                  <p className="text-xs text-muted-foreground">Adiantamentos e pagamentos avulsos</p>
                </div>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(stats.extraPago)}
                </p>
              </div>

              {/* Folha recebida */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Folha recebida</p>
                  <p className="text-xs text-muted-foreground">Repasses de folha registrados</p>
                </div>
                <p className="text-base font-semibold text-emerald-600">
                  {formatCurrency(stats.folhaPago)}
                </p>
              </div>

              {/* Barbearia */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Barbearia</p>
                  <p className="text-xs text-muted-foreground">Faturamento - comissao</p>
                </div>
                <p className="text-base font-semibold text-muted-foreground">
                  {formatCurrency(stats.barbearia)}
                </p>
              </div>

              {/* Total recebido */}
              <div className="flex items-center justify-between bg-primary/5 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Total recebido</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.amountDue > 0
                      ? `Falta receber ${formatCurrency(stats.amountDue)}`
                      : "Em dia"}
                  </p>
                </div>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(stats.totalRecebido)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
