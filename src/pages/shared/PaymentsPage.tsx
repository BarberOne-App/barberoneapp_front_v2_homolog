import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTableSelection } from "@/hooks/useTableSelection";
import {
  listAllPayments,
  updatePayment,
  type PaymentMethod,
  type PaymentRecord,
  type PaymentStatus,
  type PaymentSummary,
  type PaymentType,
} from "@/service/paymentService";

type PaymentWithType = PaymentRecord & { paymentType: PaymentType };
type ApiPaymentWithType = PaymentRecord & { paymentType: PaymentType | "extra" };
type StatusFilter = "all" | PaymentStatus;
type TypeFilter = "all" | PaymentType;
type LocalPaymentMethod = Exclude<PaymentMethod, "local" | "subscription">;
type PaymentSplitForm = { method: LocalPaymentMethod; amount: string };

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
  covered: "Coberto",
};

const statusStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  covered: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const methodLabels: Record<PaymentMethod, string> = {
  credito: "Credito",
  debito: "Debito",
  dinheiro: "Dinheiro",
  local: "No local",
  pix: "PIX",
  subscription: "Assinatura",
};

const typeLabels: Record<PaymentType, string> = {
  appointment: "Agendamento",
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

function todayDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCommandTotal(payment: PaymentRecord) {
  return payment.serviceTab?.items.reduce((sum, item) => sum + Number(item.total || 0), 0) ?? null;
}

function formatMoneyInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(Number.isFinite(value) ? value : 0);
}

function parseMoney(value: string) {
  const sanitized = value.trim().replace(/[^\d,.-]/g, "");
  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");
  let normalized = sanitized;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? sanitized.replace(/\./g, "").replace(",", ".")
      : sanitized.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = sanitized.replace(",", ".");
  } else if (lastDot >= 0) {
    const decimalDigits = sanitized.length - lastDot - 1;
    normalized = decimalDigits <= 2 ? sanitized : sanitized.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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

function getPaymentDescription(payment: PaymentWithType) {
  if (payment.paymentType === "subscription") {
    return payment.subscription?.plan?.name || "Assinatura";
  }

  if (payment.serviceTab) {
    const names = payment.serviceTab.items
      .map((item) => item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name)
      .join(", ");
    return `Comanda ${payment.serviceTab.code}${names ? ` — ${names}` : ""}`;
  }

  const serviceNames = payment.appointment?.services
    ?.map((service) => service.serviceName)
    .filter(Boolean)
    .join(", ");

  return serviceNames || "Agendamento";
}

function commandItemOriginLabel(item: NonNullable<PaymentRecord["serviceTab"]>["items"][number]) {
  if (!item.isOriginal) return "";
  if (item.type === "service") return " (serviço original)";
  if (item.type === "product") return " (produto original)";
  return " (item original)";
}

function commandItemStatus(status: PaymentStatus) {
  if (status === "paid" || status === "approved") {
    return { label: "PAGO", className: "text-emerald-700 dark:text-emerald-400" };
  }
  if (status === "covered") {
    return { label: "COBERTO", className: "text-emerald-700 dark:text-emerald-400" };
  }
  if (status === "refunded") {
    return { label: "REEMBOLSADO", className: "text-blue-700 dark:text-blue-400" };
  }
  if (status === "failed") {
    return { label: "FALHOU", className: "text-red-700 dark:text-red-400" };
  }
  return { label: "PENDENTE", className: "text-amber-700 dark:text-amber-400" };
}

function shouldShowInPaymentsPage(payment: ApiPaymentWithType): payment is PaymentWithType {
  if (!payment.user?.id) return false;
  if (payment.paymentType === "appointment") return Boolean(payment.appointmentId || payment.serviceTabId);
  if (payment.paymentType === "subscription") return Boolean(payment.subscriptionId);
  return false;
}

function collapseCommandPayments(payments: PaymentWithType[]) {
  const preferredByCommand = new Map<string, PaymentWithType>();
  for (const payment of payments) {
    if (!payment.serviceTab) continue;
    const current = preferredByCommand.get(payment.serviceTab.id);
    if (!current || (payment.serviceTabId && !current.serviceTabId)) {
      preferredByCommand.set(payment.serviceTab.id, payment);
    }
  }
  return payments.filter((payment) => !payment.serviceTab || preferredByCommand.get(payment.serviceTab.id)?.id === payment.id);
}

function downloadCsv(payments: PaymentWithType[]) {
  const header = ["ID", "Cliente", "Tipo", "Descricao", "Valor", "Metodo", "Status", "Data"];
  const rows = payments.map((payment) => [
    payment.id,
    payment.user?.name || "",
    typeLabels[payment.paymentType],
    getPaymentDescription(payment),
    String(payment.amount).replace(".", ","),
    methodLabels[payment.method] || payment.method,
    statusLabels[payment.status] || payment.status,
    formatDateTime(payment.paidAt || payment.createdAt),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "pagamentos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<PaymentWithType[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("paymentId") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedDate, setSelectedDate] = useState(
    () => searchParams.get("date") ?? todayDateString(),
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPaymentDialog, setLocalPaymentDialog] = useState<PaymentWithType | null>(null);
  const [selectedLocalMethod, setSelectedLocalMethod] = useState<LocalPaymentMethod>("dinheiro");
  const [originalAmount, setOriginalAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [surchargeAmount, setSurchargeAmount] = useState("0");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplitForm[]>([
    { method: "dinheiro", amount: "" },
    { method: "pix", amount: "" },
  ]);

  const limit = 20;

  const loadPayments = useCallback(async (dateOverride?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAllPayments({
        status: statusFilter === "all" ? undefined : statusFilter,
        date: dateOverride ?? selectedDate,
        page,
        limit,
      });

      const visibleItems = collapseCommandPayments(result.items.filter(shouldShowInPaymentsPage));

      setPayments(visibleItems);
      setTotal(result.total);
      if (result.summary) setSummary(result.summary);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, selectedDate, statusFilter]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    const term = normalizeText(search.trim());

    return payments.filter((payment) => {
      if (typeFilter !== "all" && payment.paymentType !== typeFilter) return false;
      if (!term) return true;

      const haystack = normalizeText(
        [
          payment.id,
          payment.user?.name,
          payment.user?.email,
          getPaymentDescription(payment),
          payment.appointment?.barber?.displayName,
          methodLabels[payment.method],
          statusLabels[payment.status],
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(term);
    });
  }, [payments, search, typeFilter]);

  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    filteredPayments.map((payment) => payment.id),
  );

  // Usa o summary da API (todos os pagamentos) quando disponível;
  // cai no cálculo local (página atual) como fallback.
  const stats = useMemo(() => {
    if (summary) {
      return {
        paid: summary.paid,
        today: summary.today,
        pending: summary.pending,
        refunded: summary.refunded,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    return {
      paid: payments
        .filter((p) => p.status === "paid" || p.status === "approved")
        .reduce((sum, p) => sum + p.amount, 0),
      today: payments
        .filter(
          (p) =>
            (p.paidAt || p.createdAt)?.slice(0, 10) === today &&
            (p.status === "paid" || p.status === "approved"),
        )
        .reduce((sum, p) => sum + p.amount, 0),
      pending: payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0),
      refunded: payments
        .filter((p) => p.status === "refunded")
        .reduce((sum, p) => sum + p.amount, 0),
    };
  }, [summary, payments]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const calculatedFinalAmount = Math.max(
    0,
    parseMoney(originalAmount) - parseMoney(discountAmount) + parseMoney(surchargeAmount),
  );
  const informedSplitTotal = paymentSplits.reduce(
    (sum, split) => sum + parseMoney(split.amount),
    0,
  );

  function openPaymentConfirmation(payment: PaymentWithType) {
    const currentOriginal = payment.originalAmount ?? payment.amount;
    const allowedMethod: LocalPaymentMethod =
      payment.method === "pix" || payment.method === "debito" || payment.method === "credito" || payment.method === "dinheiro"
        ? payment.method
        : "dinheiro";
    const existingSplits = payment.splits?.length
      ? payment.splits.map((split) => ({
          method: split.method,
          amount: formatMoneyInput(split.amount),
        }))
      : [
          { method: allowedMethod, amount: formatMoneyInput(payment.amount) },
          { method: allowedMethod === "pix" ? "dinheiro" as const : "pix" as const, amount: "" },
        ];

    setSelectedLocalMethod(allowedMethod);
    setOriginalAmount(formatMoneyInput(currentOriginal));
    setDiscountAmount(formatMoneyInput(payment.discountAmount ?? 0));
    setSurchargeAmount(formatMoneyInput(payment.surchargeAmount ?? 0));
    setAdjustmentNote(payment.adjustmentNote ?? "");
    setPaymentSplits(existingSplits);
    setSplitPayment((payment.splits?.length ?? 0) > 1);
    setLocalPaymentDialog(payment);
  }

  async function changePaymentStatus(payment: PaymentWithType, status: PaymentStatus) {
    if (status === "paid") {
      openPaymentConfirmation(payment);
      return;
    }

    setUpdatingId(payment.id);
    try {
      await updatePayment(payment, { status });
      toast.success("Pagamento atualizado.");
      await loadPayments();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmLocalPayment() {
    if (!localPaymentDialog) return;
    const original = parseMoney(originalAmount);
    const discount = parseMoney(discountAmount);
    const surcharge = parseMoney(surchargeAmount);
    const finalAmount = original - discount + surcharge;
    if (original < 0 || discount < 0 || surcharge < 0 || finalAmount <= 0) {
      toast.error("Informe valores validos. O valor final deve ser maior que zero.");
      return;
    }

    const splits = splitPayment
      ? paymentSplits
          .map((split) => ({ method: split.method, amount: parseMoney(split.amount) }))
          .filter((split) => split.amount > 0)
      : [{ method: selectedLocalMethod, amount: finalAmount }];
    const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
    if (splits.length === 0 || Math.abs(splitTotal - finalAmount) > 0.009) {
      toast.error("A soma das formas de pagamento deve ser igual ao valor final.");
      return;
    }

    const payment = localPaymentDialog;
    setUpdatingId(payment.id);
    try {
      await updatePayment(payment, {
        status: "paid",
        method: splits[0].method,
        originalAmount: original,
        discountAmount: discount,
        surchargeAmount: surcharge,
        adjustmentNote: adjustmentNote.trim() || null,
        splits,
      });
      toast.success("Pagamento confirmado.");
      setLocalPaymentDialog(null);
      const paidDate = todayDateString();
      setSelectedDate(paidDate);
      setPage(1);
      await loadPayments(paidDate);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Recebido</p>
          <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(stats.paid)}</h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Hoje</p>
          <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(stats.today)}</h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Pendentes</p>
          <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(stats.pending)}</h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">Reembolsado</p>
          <h3 className="text-2xl font-semibold text-foreground">{formatCurrency(stats.refunded)}</h3>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-base font-medium text-foreground">Todos Pagamentos</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="payments-date" className="sr-only">Data dos pagamentos</Label>
              <Input
                id="payments-date"
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value || todayDateString());
                  setPage(1);
                }}
                className="h-9 w-40 bg-secondary"
                title="Pagos usam a data da confirmacao; pendentes usam a data do agendamento"
              />
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pagamentos..."
                className="h-9 w-full bg-secondary pl-9 text-sm sm:w-56"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter size={14} />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as StatusFilter);
                    setPage(1);
                  }}
                >
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">Pendentes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="approved">Aprovados</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="paid">Pagos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="failed">Falharam</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="refunded">Reembolsados</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="covered">Cobertos</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CreditCard size={14} />
                  Tipo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as TypeFilter)}
                >
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="appointment">Agendamentos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="subscription">Assinaturas</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadCsv(filteredPayments)}
              disabled={filteredPayments.length === 0}
            >
              <Download size={14} />
              Exportar
            </Button>
          </div>
        </div>

        {error ? (
          <div className="p-6 text-sm text-destructive">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 p-4">
                    <Checkbox
                      checked={
                        selectedRows.length === filteredPayments.length &&
                        filteredPayments.length > 0
                      }
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Origem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Metodo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Observacao
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Carregando pagamentos...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                      Nenhum pagamento encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border transition-colors last:border-b-0 hover:bg-secondary/30"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedRows.includes(payment.id)}
                          onCheckedChange={() => toggleRow(payment.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {payment.user?.name || "Cliente"}
                          </p>
                          <p className="text-xs text-muted-foreground">#{payment.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {payment.serviceTab ? <div className="min-w-80 space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Comanda {payment.serviceTab.code}</p>
                            <p className="text-xs text-muted-foreground">Comanda{payment.appointment?.barber?.displayName ? ` - ${payment.appointment.barber.displayName}` : ""}</p>
                          </div>
                          <div className="space-y-1 rounded-md border border-primary bg-primary p-2 text-black">
                            {payment.serviceTab.items.map((item, index) => {
                              const itemStatus = commandItemStatus(item.status);
                              return <div key={`${payment.id}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-xs">
                                <span className="truncate text-black" title={`${item.quantity}x ${item.name}${commandItemOriginLabel(item)}`}>{item.quantity}x {item.name}<span className="text-black/70">{commandItemOriginLabel(item)}</span></span>
                                <span className="whitespace-nowrap font-medium text-black">{formatCurrency(item.total)}</span>
                                <span className="whitespace-nowrap text-[10px] font-bold text-black">{itemStatus.label}</span>
                              </div>;
                            })}
                          </div>
                        </div> : <div>
                          <p className="text-sm font-medium text-foreground">{getPaymentDescription(payment)}</p>
                          <p className="text-xs text-muted-foreground">{typeLabels[payment.paymentType]}{payment.appointment?.barber?.displayName ? ` - ${payment.appointment.barber.displayName}` : ""}</p>
                        </div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        {payment.serviceTab && <>
                          <p className="text-[11px] text-muted-foreground">A receber</p>
                          {Math.abs((getCommandTotal(payment) ?? payment.amount) - payment.amount) > 0.009 && (
                            <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
                              Total da comanda: {formatCurrency(getCommandTotal(payment) ?? payment.amount)}
                            </p>
                          )}
                        </>}
                      </td>
                      <td className="px-4 py-3">
                        {payment.splits && payment.splits.length > 1 ? <div className="space-y-1">{payment.splits.map((split, index) => <div key={split.id ?? `${payment.id}-${index}`} className="flex items-center justify-between gap-3 rounded border px-2 py-1 text-xs"><span>{methodLabels[split.method]}</span><strong>{formatCurrency(split.amount)}</strong></div>)}</div> : <div className="flex items-center gap-2 text-sm text-foreground"><CreditCard size={14} className="text-muted-foreground" />{methodLabels[payment.method] || payment.method}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar size={14} />
                          {formatDateTime(payment.effectiveDate || payment.paidAt || payment.appointment?.startAt || payment.createdAt)}
                        </div>
                      </td>
                      <td className="max-w-56 px-4 py-3 text-sm text-muted-foreground">
                        <span className="block truncate" title={payment.adjustmentNote || ""}>
                          {payment.adjustmentNote || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[payment.status]}`}
                        >
                          {(payment.status === "paid" || payment.status === "approved") && (
                            <CheckCircle size={12} className="mr-1 inline" />
                          )}
                          {statusLabels[payment.status] || payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                              disabled={updatingId === payment.id}
                            >
                              {updatingId === payment.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <MoreHorizontal size={16} />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => changePaymentStatus(payment, "paid")}
                            >
                              <CheckCircle size={14} />
                              {payment.status === "paid" ? "Editar pagamento" : "Confirmar pagamento"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={payment.status === "pending"}
                              onClick={() => changePaymentStatus(payment, "pending")}
                            >
                              <RefreshCcw size={14} />
                              Marcar pendente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={payment.status === "failed"}
                              onClick={() => changePaymentStatus(payment, "failed")}
                            >
                              <XCircle size={14} />
                              Marcar falha
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={payment.status === "refunded"}
                              onClick={() => changePaymentStatus(payment, "refunded")}
                            >
                              <RefreshCcw size={14} />
                              Marcar reembolso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Pagina {page} de {totalPages} - {total} pagamentos
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
      <Dialog open={Boolean(localPaymentDialog)} onOpenChange={(open) => { if (!open) setLocalPaymentDialog(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription>
              Confira o valor, registre ajustes e informe como o pagamento foi realizado por{" "}
              <span className="font-medium text-foreground">
                {localPaymentDialog?.user?.name ?? "este cliente"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="payment-original">Valor original</Label>
                <Input id="payment-original" inputMode="decimal" value={originalAmount} onChange={(event) => setOriginalAmount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-discount">Desconto</Label>
                <Input id="payment-discount" inputMode="decimal" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-surcharge">Acrescimo</Label>
                <Input id="payment-surcharge" inputMode="decimal" value={surchargeAmount} onChange={(event) => setSurchargeAmount(event.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
              <span className="text-sm text-muted-foreground">Valor final</span>
              <strong className="text-xl text-primary">{formatCurrency(calculatedFinalAmount)}</strong>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-note">Observacao do ajuste</Label>
              <Textarea
                id="payment-note"
                value={adjustmentNote}
                onChange={(event) => setAdjustmentNote(event.target.value)}
                maxLength={200}
                placeholder="Opcional: motivo do desconto, acrescimo ou observacao do recebimento"
                rows={2}
              />
              <p className="text-right text-xs text-muted-foreground">{adjustmentNote.length}/200</p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm font-medium">
              <Checkbox checked={splitPayment} onCheckedChange={(checked) => setSplitPayment(checked === true)} />
              Dividir pagamento em mais de uma forma
            </label>

            {splitPayment ? (
              <div className="space-y-3">
                {paymentSplits.map((split, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select
                      value={split.method}
                      onChange={(event) => setPaymentSplits((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, method: event.target.value as LocalPaymentMethod } : item))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="credito">Cartao credito</option>
                      <option value="debito">Cartao debito</option>
                    </select>
                    <Input
                      inputMode="decimal"
                      value={split.amount}
                      placeholder="Valor"
                      onChange={(event) => setPaymentSplits((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, amount: event.target.value } : item))}
                    />
                    <Button type="button" variant="ghost" size="icon" disabled={paymentSplits.length <= 1} onClick={() => setPaymentSplits((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setPaymentSplits((current) => [...current, { method: "pix", amount: "" }])}>
                  <Plus className="h-4 w-4" /> Adicionar forma
                </Button>
                <div className="grid grid-cols-2 gap-3 rounded-md bg-secondary/50 p-3 text-sm">
                  <span>Informado: <strong>{formatCurrency(informedSplitTotal)}</strong></span>
                  <span className="text-right">Falta: <strong className={Math.abs(calculatedFinalAmount - informedSplitTotal) > 0.009 ? "text-destructive" : "text-emerald-600"}>{formatCurrency(Math.max(0, calculatedFinalAmount - informedSplitTotal))}</strong></span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { value: "dinheiro", label: "Dinheiro" },
                    { value: "pix", label: "PIX" },
                    { value: "credito", label: "Cartao Credito" },
                    { value: "debito", label: "Cartao Debito" },
                  ] as { value: LocalPaymentMethod; label: string }[]
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedLocalMethod(value)}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${selectedLocalMethod === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-secondary/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocalPaymentDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmLocalPayment}>
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
