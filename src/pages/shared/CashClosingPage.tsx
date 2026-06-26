import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  createCashClosing,
  getCashClosingPreview,
  getCashClosingReport,
  listCashClosings,
  type CashClosing,
  type CashClosingPayment,
  type CashClosingSummary,
} from "@/service/cashClosingService";
import type { PaymentMethod } from "@/service/paymentService";
import { downloadPdfReport, type ReportColumn } from "@/utils/reportExport";

type OpenCashSession = {
  openedAt: string;
  openedBy: string;
  openedByName: string;
};

const openCashSessionKey = "cashClosing:openSession";

const methodLabels: Record<PaymentMethod, string> = {
  credito: "Credito",
  debito: "Debito",
  dinheiro: "Dinheiro",
  local: "No local",
  pix: "PIX",
  subscription: "Assinatura",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatReportDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getStoredOpenCashSession() {
  const storedSession = localStorage.getItem(openCashSessionKey);

  if (!storedSession) return null;

  try {
    return JSON.parse(storedSession) as OpenCashSession;
  } catch {
    localStorage.removeItem(openCashSessionKey);
    return null;
  }
}

function getCashPaymentDescription(payment: CashClosingPayment) {
  if (payment.type === "subscription") return payment.subscriptionPlanName || "Assinatura";
  if (payment.type === "extra") return "Pagamento extra";
  return "Agendamento";
}

function collectCashClosingReportData(closings: CashClosing[]) {
  const orderedClosings = [...closings]
    .filter((closing) => closing.paymentCount > 0 && closing.totalAmount > 0)
    .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());
  const movements = orderedClosings.flatMap((closing, closingIndex) =>
    [...closing.payments]
      .sort(
        (a, b) =>
          new Date(a.paidAt || a.createdAt).getTime() -
          new Date(b.paidAt || b.createdAt).getTime(),
      )
      .map((payment) => ({ closing, closingIndex, payment })),
  );
  const totalAmount = movements.reduce((sum, item) => sum + item.payment.amount, 0);
  const totalAppointments = movements.filter((item) => item.payment.type === "appointment").length;
  const totalsByMethod = movements.reduce<Record<string, number>>((acc, item) => {
    const method = item.payment.method;
    acc[method] = (acc[method] ?? 0) + item.payment.amount;
    return acc;
  }, {});
  const periodLabel = orderedClosings.length
    ? `${formatReportDateTime(orderedClosings[0].periodStart)} ate ${formatReportDateTime(orderedClosings[orderedClosings.length - 1].periodEnd)}`
    : "-";

  return {
    orderedClosings,
    movements,
    totalAmount,
    totalAppointments,
    totalsByMethod,
    periodLabel,
  };
}

async function downloadCashClosingsPdf(closings: CashClosing[]) {
  const validClosings = closings.filter((closing) => closing.paymentCount > 0 && closing.totalAmount > 0);
  if (validClosings.length === 0) {
    toast.error("Nao ha fechamentos com movimentacoes para exportar.");
    return;
  }

  const data = collectCashClosingReportData(validClosings);
  const columns: ReportColumn<(typeof data.movements)[number]>[] = [
    { header: "#", getValue: ({ closingIndex }) => String(closingIndex + 1), align: "center" },
    { header: "Pago em", getValue: ({ payment }) => formatReportDateTime(payment.paidAt || payment.createdAt) },
    { header: "Cliente", getValue: ({ payment }) => payment.clientName || "Cliente nao informado" },
    { header: "Tipo", getValue: ({ payment }) => getCashPaymentDescription(payment) },
    { header: "Forma", getValue: ({ payment }) => methodLabels[payment.method] || payment.method, align: "center" },
    { header: "Fechado por", getValue: ({ closing }) => closing.closedByName || "Usuario nao identificado" },
    { header: "Valor", getValue: ({ payment }) => formatCurrency(payment.amount), align: "center" },
  ];

  downloadPdfReport(
    `fechamentos-caixa-${new Date().toISOString().slice(0, 10)}.pdf`,
    {
      title: "Relatorio de Fechamento de Caixa",
      subtitle: `Periodo consolidado: ${data.periodLabel}`,
      columns,
      rows: data.movements,
      summary: [
        ["Fechamentos", data.orderedClosings.length],
        ["Atendimentos", data.totalAppointments],
        ["Movimentacoes", data.movements.length],
        ["Total geral", formatCurrency(data.totalAmount)],
      ],
    },
  );
}

function downloadCashClosingsCsv(closings: CashClosing[]) {
  const orderedClosings = [...closings]
    .filter((closing) => closing.paymentCount > 0 && closing.totalAmount > 0)
    .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());

  if (orderedClosings.length === 0) {
    toast.error("Nao ha fechamentos com movimentacoes para exportar.");
    return;
  }

  const movements = orderedClosings.flatMap((closing, closingIndex) =>
    [...closing.payments]
      .sort(
        (a, b) =>
          new Date(a.paidAt || a.createdAt).getTime() -
          new Date(b.paidAt || b.createdAt).getTime(),
      )
      .map((payment) => ({ closing, closingIndex, payment })),
  );
  const totalsByMethod = movements.reduce<Record<string, number>>((acc, item) => {
    const method = item.payment.method;
    acc[method] = (acc[method] ?? 0) + item.payment.amount;
    return acc;
  }, {});
  const totalAmount = movements.reduce((sum, item) => sum + item.payment.amount, 0);
  const totalAppointments = movements.filter((item) => item.payment.type === "appointment").length;
  const header = [
    "Fechamento",
    "Fechado por",
    "Fechado em",
    "Periodo",
    "Cliente",
    "Tipo",
    "Valor",
    "Metodo",
    "Status",
    "Pago em",
  ];
  const movementRows = movements.map(({ closing, closingIndex, payment }) => {
    const period = `${formatReportDateTime(closing.periodStart)} - ${formatReportDateTime(closing.periodEnd)}`;
    return [
      String(closingIndex + 1),
      closing.closedByName || "Usuario nao identificado",
      formatReportDateTime(closing.closedAt),
      period,
      payment.clientName || "",
      getCashPaymentDescription(payment),
      String(payment.amount).replace(".", ","),
      methodLabels[payment.method] || payment.method,
      payment.status,
      formatReportDateTime(payment.paidAt || payment.createdAt),
    ];
  });
  const summaryRows = [
    [],
    ["Resumo financeiro consolidado"],
    ["Quantidade de atendimentos", String(totalAppointments)],
    ["Quantidade de movimentacoes", String(movements.length)],
    ...Object.entries(totalsByMethod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([method, amount]) => [
        methodLabels[method as PaymentMethod] || method,
        String(amount).replace(".", ","),
      ]),
    ["Total Geral do Fechamento", String(totalAmount).replace(".", ",")],
  ];
  const csv = [header, ...movementRows, ...summaryRows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `fechamentos-caixa-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CashClosingPage() {
  const { user } = useAuth();
  const [closingCash, setClosingCash] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [cashPreview, setCashPreview] = useState<CashClosingSummary | null>(null);
  const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);
  const [openCashSession, setOpenCashSession] = useState<OpenCashSession | null>(() =>
    getStoredOpenCashSession(),
  );
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const loadCashClosings = useCallback(async () => {
    setLoading(true);

    try {
      const [preview, closings] = await Promise.all([
        getCashClosingPreview(),
        listCashClosings(dateFilter ? { date: dateFilter } : {}),
      ]);
      setCashPreview(preview);
      setCashClosings(closings);
    } catch (err) {
      setCashPreview(null);
      setCashClosings([]);
      toast.error(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    void loadCashClosings();
  }, [loadCashClosings]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, search]);

  const filteredClosings = useMemo(() => {
    const term = normalizeText(search.trim());

    return cashClosings.filter((closing) => {
      if (!term) return true;

      const haystack = normalizeText(
        [
          closing.id,
          closing.closedByName,
          closing.closedBy,
          formatCurrency(closing.totalAmount),
          formatDateTime(closing.closedAt),
          formatDateTime(closing.periodStart),
          formatDateTime(closing.periodEnd),
          String(closing.paymentCount),
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(term);
    });
  }, [cashClosings, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClosings.length / limit));
  const paginatedClosings = filteredClosings.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const cashIsOpen = Boolean(openCashSession);

  function handleOpenCash() {
    const session = {
      openedAt: new Date().toISOString(),
      openedBy: user?.id || "",
      openedByName: user?.name || "Usuario nao identificado",
    };

    localStorage.setItem(openCashSessionKey, JSON.stringify(session));
    setOpenCashSession(session);
    toast.success("Caixa aberto com sucesso.");
  }

  async function handleCloseCash() {
    setClosingCash(true);
    try {
      await createCashClosing();
      localStorage.removeItem(openCashSessionKey);
      setOpenCashSession(null);
      toast.success("Caixa fechado com sucesso.");
      await loadCashClosings();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setClosingCash(false);
    }
  }

  async function handleCashAction() {
    if (!cashIsOpen) {
      handleOpenCash();
      return;
    }

    await handleCloseCash();
  }

  async function loadCashClosingReports() {
    return Promise.all(filteredClosings.map((closing) => getCashClosingReport(closing.id)));
  }

  async function handleExportCashClosingsPdf() {
    if (filteredClosings.length === 0) return;

    setExportingPdf(true);
    try {
      const reports = await loadCashClosingReports();
      await downloadCashClosingsPdf(reports);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleExportCashClosingsCsv() {
    if (filteredClosings.length === 0) return;

    setExportingCsv(true);
    try {
      const reports = await loadCashClosingReports();
      downloadCashClosingsCsv(reports);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setExportingCsv(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Status do caixa</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {cashIsOpen ? "Aberto" : "Fechado"}
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Caixa aberto</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {formatCurrency(cashPreview?.totalAmount ?? 0)}
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Pagamentos em aberto</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {cashPreview?.paymentCount ?? 0}
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Aberto por</p>
          <h3 className="truncate text-2xl font-semibold text-foreground">
            {openCashSession?.openedByName || "-"}
          </h3>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">Fechamento de caixa</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {cashIsOpen
                ? `Caixa aberto por ${openCashSession?.openedByName || "Usuario nao identificado"}.`
                : "Abra o caixa para iniciar um novo periodo de trabalho."}
            </p>
            {cashIsOpen && openCashSession ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Aberto em: {formatDateTime(openCashSession.openedAt)}
              </p>
            ) : null}
            {cashPreview && cashIsOpen ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Movimentacoes: {formatCurrency(cashPreview.totalAmount)} em {cashPreview.paymentCount} pagamento(s).
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExportCashClosingsPdf}
              disabled={exportingPdf || filteredClosings.length === 0}
              className="gap-2"
            >
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCashClosingsCsv}
              disabled={exportingCsv || filteredClosings.length === 0}
              className="gap-2"
            >
              {exportingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
              Exportar CSV
            </Button>
            <Button onClick={handleCashAction} disabled={closingCash || loading} className="gap-2">
              {closingCash ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={14} />}
              {cashIsOpen ? "Fechar caixa" : "Abrir caixa"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Resumo do caixa aberto</p>
            <div className="space-y-2 text-sm">
              {!cashIsOpen ? (
                <p className="text-muted-foreground">O caixa ainda nao foi aberto.</p>
              ) : cashPreview && Object.keys(cashPreview.totalsByMethod).length > 0 ? (
                Object.entries(cashPreview.totalsByMethod).map(([method, amount]) => (
                  <div key={method} className="flex justify-between">
                    <span className="text-muted-foreground">{methodLabels[method as PaymentMethod] || method}</span>
                    <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhum pagamento recebido no caixa aberto.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">Historico de fechamento</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredClosings.length} fechamento(s) encontrado(s).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar fechamento..."
                className="h-9 w-full bg-secondary pl-9 text-sm sm:w-56"
              />
            </div>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-9 w-full bg-secondary pl-9 text-sm sm:w-44"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFilter("");
                setSearch("");
              }}
              disabled={!dateFilter && !search}
            >
              Limpar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fechamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Periodo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fechado por
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pagamentos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Carregando fechamentos...
                  </td>
                </tr>
              ) : paginatedClosings.length > 0 ? (
                paginatedClosings.map((closing) => (
                  <tr
                    key={closing.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {formatDateTime(closing.closedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">#{closing.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDateTime(closing.periodStart)} - {formatDateTime(closing.periodEnd)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {closing.closedByName || "Usuario nao identificado"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
                        {closing.paymentCount} pag.
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      {formatCurrency(closing.totalAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum fechamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Pagina {page} de {totalPages} - {filteredClosings.length} fechamento(s)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Proxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
