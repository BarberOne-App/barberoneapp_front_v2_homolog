import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

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
import { useTableSelection } from "@/hooks/useTableSelection";
import barberOneLogo from "@/assets/image/barberOne-logo.png";
import {
  createCashClosing,
  getCashClosingPreview,
  getCashClosingReport,
  listCashClosings,
  type CashClosing,
  type CashClosingPayment,
  type CashClosingSummary,
} from "@/service/cashClosingService";
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
type StatusFilter = "all" | PaymentStatus;
type TypeFilter = "all" | PaymentType;

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

  const serviceNames = payment.appointment?.services
    ?.map((service) => service.serviceName)
    .filter(Boolean)
    .join(", ");

  return serviceNames || "Agendamento";
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

function getCashPaymentDescription(payment: CashClosingPayment) {
  if (payment.type === "subscription") return payment.subscriptionPlanName || "Assinatura";
  if (payment.type === "extra") return "Pagamento extra";
  return "Agendamento";
}

function sanitizePdfText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: unknown) {
  return sanitizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
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

async function loadLogoForPdf() {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = barberOneLogo;
  await image.decode();

  const canvas = document.createElement("canvas");
  const maxWidth = 180;
  const ratio = image.naturalWidth > 0 ? maxWidth / image.naturalWidth : 1;
  canvas.width = maxWidth;
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return {
    bytes,
    width: canvas.width,
    height: canvas.height,
  };
}

async function createCashClosingsPdfBlob(closings: CashClosing[]) {
  const encoder = new TextEncoder();
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 36;
  const topY = 790;
  const bottomY = 42;
  const contentWidth = pageWidth - marginX * 2;
  const pages: string[] = [];
  let content = "";
  let y = topY;
  const data = collectCashClosingReportData(closings);
  const logo = await loadLogoForPdf().catch(() => null);

  function pushPage() {
    if (content) pages.push(content);
    content = "";
    y = topY;
  }

  function ensureSpace(height: number) {
    if (y - height < bottomY) pushPage();
  }

  function setStroke(gray: number) {
    content += `${gray} G\n`;
  }

  function setFill(gray: number) {
    content += `${gray} g\n`;
  }

  function text(value: unknown, x: number, size = 9, bold = false) {
    const font = bold ? "F2" : "F1";
    content += `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET\n`;
  }

  function rect(x: number, yy: number, width: number, height: number, fill = false) {
    content += `${x} ${yy} ${width} ${height} re ${fill ? "f" : "S"}\n`;
  }

  function approximateTextWidth(value: unknown, size: number) {
    return sanitizePdfText(value).length * size * 0.46;
  }

  function textRight(value: unknown, rightX: number, size = 9, bold = false) {
    text(value, rightX - approximateTextWidth(value, size), size, bold);
  }

  function wrapTextByWidth(value: unknown, width: number, size: number) {
    const maxChars = Math.max(8, Math.floor(width / (size * 0.48)));
    const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    words.forEach((word) => {
      if (word.length > maxChars) {
        if (current) {
          lines.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += maxChars) {
          lines.push(word.slice(index, index + maxChars));
        }
        return;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  function drawBox(x: number, yy: number, width: number, height: number, label: string, value: string) {
    setFill(0.965);
    rect(x, yy, width, height, true);
    setStroke(0.78);
    rect(x, yy, width, height);
    setFill(0);
    const oldY = y;
    y = yy + height - 12;
    text(label, x + 10, 8);
    y = yy + 8;
    text(value, x + 10, 13, true);
    y = oldY;
  }

  function header() {
    setFill(0);
    if (logo) {
      const logoWidth = 86;
      const logoHeight = Math.round((logo.height / logo.width) * logoWidth);
      content += `q ${logoWidth} 0 0 ${logoHeight} ${marginX} ${topY - logoHeight + 6} cm /Im1 Do Q\n`;
    } else {
      text("BARBER ONE", marginX, 10, true);
    }
    textRight("Fechamento de caixa", pageWidth - marginX, 10, true);
    y -= 17;
    text("Relatorio de fechamento de caixa", logo ? marginX + 100 : marginX, 17, true);
    y -= 19;
    text(`Periodo consolidado: ${data.periodLabel}`, logo ? marginX + 100 : marginX, 9);
    y -= 12;
    text(`Gerado em: ${formatReportDateTime(new Date().toISOString())}`, logo ? marginX + 100 : marginX, 9);
    y -= 17;

    const boxes = [
      ["Fechamentos", String(data.orderedClosings.length)],
      ["Atendimentos", String(data.totalAppointments)],
      ["Movimentacoes", String(data.movements.length)],
      ["Total geral", formatCurrency(data.totalAmount)],
    ];
    const boxWidth = (contentWidth - 24) / 4;

    boxes.forEach(([label, value], index) => {
      const x = marginX + index * (boxWidth + 8);
      drawBox(x, y - 28, boxWidth, 32, label, value);
    });

    y -= 44;
  }

  function sectionTitle(title: string) {
    ensureSpace(30);
    y -= 10;
    setFill(0);
    text(title, marginX, 11, true);
    y -= 12;
    setStroke(0.25);
    content += `0.8 w ${marginX} ${y + 4} m ${pageWidth - marginX} ${y + 4} l S\n`;
    y -= 9;
  }

  type PdfColumn<T> = {
    header: string;
    width: number;
    align?: "left" | "right";
    getValue: (row: T, index: number) => string;
  };

  function tableHeader<T>(columns: PdfColumn<T>[]) {
    const headerHeight = 18;
    setFill(0.92);
    rect(marginX, y - headerHeight + 4, contentWidth, headerHeight, true);
    setStroke(0.72);
    rect(marginX, y - headerHeight + 4, contentWidth, headerHeight);
    setFill(0);
    let x = marginX;
    columns.forEach((column) => {
      text(column.header, x + 4, 8, true);
      x += column.width;
    });
    y -= headerHeight + 5;
  }

  function drawTable<T>(columns: PdfColumn<T>[], rows: T[], emptyText: string) {
    tableHeader(columns);

    if (rows.length === 0) {
      ensureSpace(22);
      text(emptyText, marginX + 4, 9);
      y -= 18;
      return;
    }

    rows.forEach((row, rowIndex) => {
      const cellLines = columns.map((column) =>
        wrapTextByWidth(column.getValue(row, rowIndex), column.width - 8, 8),
      );
      const rowHeight = Math.max(26, Math.max(...cellLines.map((lines) => lines.length)) * 10 + 12);

      if (y - rowHeight < bottomY) {
        pushPage();
        tableHeader(columns);
      }

      setStroke(0.82);
      rect(marginX, y - rowHeight + 4, contentWidth, rowHeight);

      let x = marginX;
      columns.forEach((column, columnIndex) => {
        const lines = cellLines[columnIndex];
        if (columnIndex > 0) {
          content += `0.25 w ${x} ${y + 4} m ${x} ${y - rowHeight + 4} l S\n`;
        }

        lines.forEach((lineText, lineIndex) => {
          const textY = y - 9 - lineIndex * 10;
          const oldY = y;
          y = textY;
          if (column.align === "right") {
            textRight(lineText, x + column.width - 5, 8);
          } else {
            text(lineText, x + 4, 8);
          }
          y = oldY;
        });
        x += column.width;
      });

      y -= rowHeight + 2;
    });
  }

  header();
  sectionTitle("Movimentacoes do fechamento");
  drawTable(
    [
      { header: "#", width: 24, getValue: ({ closingIndex }) => String(closingIndex + 1) },
      { header: "Pago em", width: 78, getValue: ({ payment }) => formatReportDateTime(payment.paidAt || payment.createdAt) },
      { header: "Cliente", width: 105, getValue: ({ payment }) => payment.clientName || "Cliente nao informado" },
      { header: "Tipo", width: 78, getValue: ({ payment }) => getCashPaymentDescription(payment) },
      { header: "Forma", width: 58, getValue: ({ payment }) => methodLabels[payment.method] || payment.method },
      { header: "Fechado por", width: 102, getValue: ({ closing }) => closing.closedByName || "Usuario nao identificado" },
      { header: "Valor", width: 78, align: "right", getValue: ({ payment }) => formatCurrency(payment.amount) },
    ],
    data.movements,
    "Nenhuma movimentacao neste relatorio.",
  );

  sectionTitle("Resumo financeiro consolidado");
  const methodEntries = Object.entries(data.totalsByMethod).sort(([a], [b]) => a.localeCompare(b));
  const summaryHeight = Math.max(112, 96 + methodEntries.length * 16);
  ensureSpace(summaryHeight + 18);
  setFill(0.97);
  rect(marginX, y - summaryHeight + 8, contentWidth, summaryHeight, true);
  setStroke(0.78);
  rect(marginX, y - summaryHeight + 8, contentWidth, summaryHeight);
  setFill(0);
  text(`Quantidade de atendimentos: ${data.totalAppointments}`, marginX + 14, 9);
  text(`Quantidade de movimentacoes: ${data.movements.length}`, marginX + 275, 9);
  y -= 24;
  text("Totais por forma de pagamento", marginX + 14, 10, true);
  y -= 18;
  methodEntries.forEach(([method, amount]) => {
      text(`${methodLabels[method as PaymentMethod] || method}: ${formatCurrency(amount)}`, marginX + 12, 10);
      y -= 16;
    });
  setStroke(0.28);
  content += `1 w ${marginX + 14} ${y + 8} m ${pageWidth - marginX - 14} ${y + 8} l S\n`;
  y -= 12;
  setFill(0.9);
  rect(marginX + 10, y - 20, contentWidth - 20, 28, true);
  setFill(0);
  text("Total Geral do Fechamento", marginX + 20, 11, true);
  textRight(formatCurrency(data.totalAmount), pageWidth - marginX - 20, 14, true);
  y -= 48;

  sectionTitle("Fechamentos incluidos");
  drawTable(
    [
      { header: "#", width: 26, getValue: (_closing, index) => String(index + 1) },
      { header: "Inicio", width: 118, getValue: (closing) => formatReportDateTime(closing.periodStart) },
      { header: "Fim", width: 118, getValue: (closing) => formatReportDateTime(closing.periodEnd) },
      { header: "Fechado por", width: 166, getValue: (closing) => closing.closedByName || "Usuario nao identificado" },
      { header: "Total", width: 95, align: "right", getValue: (closing) => formatCurrency(closing.totalAmount) },
    ],
    data.orderedClosings,
    "Nenhum fechamento incluido.",
  );

  if (content) pages.push(content);
  if (pages.length === 0) pages.push("");

  const objects: Array<Array<string | Uint8Array> | undefined> = [];
  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  const imageObjectId = 5 + pages.length * 2;
  objects[1] = ["<< /Type /Catalog /Pages 2 0 R >>"];
  objects[2] = [`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`];
  objects[3] = ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  objects[4] = ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];

  pages.forEach((pageContent, index) => {
    const pageId = 5 + index * 2;
    const contentId = pageId + 1;
    const length = encoder.encode(pageContent).length;

    objects[pageId] = [[
      "<< /Type /Page",
      "/Parent 2 0 R",
      `/MediaBox [0 0 ${pageWidth} ${pageHeight}]`,
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${logo ? `/XObject << /Im1 ${imageObjectId} 0 R >>` : ""} >>`,
      `/Contents ${contentId} 0 R`,
      ">>",
    ].join(" ")];
    objects[contentId] = [`<< /Length ${length} >>\nstream\n${pageContent}endstream`];
  });

  if (logo) {
    objects[imageObjectId] = [
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.byteLength} >>\nstream\n`,
      logo.bytes,
      "\nendstream",
    ];
  }

  const offsets: number[] = [];
  const parts: BlobPart[] = ["%PDF-1.4\n"];
  let byteLength = encoder.encode(parts[0] as string).length;

  function partLength(part: string | Uint8Array) {
    return typeof part === "string" ? encoder.encode(part).length : part.byteLength;
  }

  function pushPart(part: string | Uint8Array) {
    parts.push(
      typeof part === "string"
        ? part
        : part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer,
    );
    byteLength += partLength(part);
  }

  for (let id = 1; id < objects.length; id += 1) {
    if (!objects[id]) continue;
    offsets[id] = byteLength;
    pushPart(`${id} 0 obj\n`);
    objects[id]!.forEach(pushPart);
    pushPart("\nendobj\n");
  }

  const xrefOffset = byteLength;
  pushPart(`xref\n0 ${objects.length}\n`);
  pushPart("0000000000 65535 f \n");

  for (let id = 1; id < objects.length; id += 1) {
    pushPart(`${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`);
  }

  pushPart(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}

async function downloadCashClosingsPdf(closings: CashClosing[]) {
  const validClosings = closings.filter((closing) => closing.paymentCount > 0 && closing.totalAmount > 0);
  if (validClosings.length === 0) {
    toast.error("Nao ha fechamentos com movimentacoes para exportar.");
    return;
  }

  const blob = await createCashClosingsPdfBlob(validClosings);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `fechamentos-caixa-${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadCashClosingsCsv(closings: CashClosing[]) {
  const orderedClosings = [...closings]
    .filter((closing) => closing.paymentCount > 0 && closing.totalAmount > 0)
    .sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
  );
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

export function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithType[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [closingCash, setClosingCash] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPaymentDialog, setLocalPaymentDialog] = useState<PaymentWithType | null>(null);
  const [selectedLocalMethod, setSelectedLocalMethod] = useState<PaymentMethod>("dinheiro");
  const [cashPreview, setCashPreview] = useState<CashClosingSummary | null>(null);
  const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);

  const limit = 20;

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAllPayments({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        limit,
      });

      setPayments(result.items);
      setTotal(result.total);
      if (result.summary) setSummary(result.summary);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const loadCashClosings = useCallback(async () => {
    try {
      const [preview, closings] = await Promise.all([
        getCashClosingPreview(),
        listCashClosings(),
      ]);
      setCashPreview(preview);
      setCashClosings(closings);
    } catch {
      setCashPreview(null);
      setCashClosings([]);
    }
  }, []);

  useEffect(() => {
    void loadCashClosings();
  }, [loadCashClosings]);

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

  async function changePaymentStatus(payment: PaymentWithType, status: PaymentStatus) {
    if (status === "paid" && payment.method === "local") {
      setSelectedLocalMethod("dinheiro");
      setLocalPaymentDialog(payment);
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
    const payment = localPaymentDialog;
    setLocalPaymentDialog(null);
    setUpdatingId(payment.id);
    try {
      await updatePayment(payment, { status: "paid", method: selectedLocalMethod });
      toast.success("Pagamento confirmado.");
      await loadPayments();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCloseCash() {
    setClosingCash(true);
    try {
      await createCashClosing();
      toast.success("Caixa fechado com sucesso.");
      await Promise.all([loadPayments(), loadCashClosings()]);
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setClosingCash(false);
    }
  }

  async function loadCashClosingReports() {
    return Promise.all(cashClosings.map((closing) => getCashClosingReport(closing.id)));
  }

  async function handleExportCashClosingsPdf() {
    if (cashClosings.length === 0) return;

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
    if (cashClosings.length === 0) return;

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

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">Fechamento de caixa</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Caixa aberto: {formatCurrency(cashPreview?.totalAmount ?? 0)} em{" "}
              {cashPreview?.paymentCount ?? 0} pagamento(s).
            </p>
            {cashPreview ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Periodo: {formatDateTime(cashPreview.periodStart)} - {formatDateTime(cashPreview.periodEnd)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExportCashClosingsPdf}
              disabled={exportingPdf || cashClosings.length === 0}
              className="gap-2"
            >
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCashClosingsCsv}
              disabled={exportingCsv || cashClosings.length === 0}
              className="gap-2"
            >
              {exportingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
              Exportar CSV
            </Button>
            <Button onClick={handleCloseCash} disabled={closingCash} className="gap-2">
              {closingCash ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={14} />}
              Fechar caixa
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Resumo do caixa aberto</p>
            <div className="space-y-2 text-sm">
              {cashPreview && Object.keys(cashPreview.totalsByMethod).length > 0 ? (
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
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Fechamentos do dia</p>
            <div className="max-h-44 space-y-3 overflow-y-auto text-sm">
              {cashClosings.length > 0 ? (
                cashClosings.map((closing) => (
                  <div key={closing.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium text-foreground">{formatCurrency(closing.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(closing.periodStart)} - {formatDateTime(closing.periodEnd)}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
                      {closing.paymentCount} pag.
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhum fechamento realizado hoje.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-base font-medium text-foreground">Todos Pagamentos</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                    Status
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Carregando pagamentos...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
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
                            {payment.user?.name || "Cliente nao informado"}
                          </p>
                          <p className="text-xs text-muted-foreground">#{payment.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getPaymentDescription(payment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {typeLabels[payment.paymentType]}
                            {payment.appointment?.barber?.displayName
                              ? ` - ${payment.appointment.barber.displayName}`
                              : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <CreditCard size={14} className="text-muted-foreground" />
                          {methodLabels[payment.method] || payment.method}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar size={14} />
                          {formatDateTime(payment.paidAt || payment.createdAt)}
                        </div>
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
                              disabled={payment.status === "paid"}
                              onClick={() => changePaymentStatus(payment, "paid")}
                            >
                              <CheckCircle size={14} />
                              Marcar como pago
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Como foi realizado o pagamento?</DialogTitle>
            <DialogDescription>
              Selecione a forma de pagamento usada no local para{" "}
              <span className="font-medium text-foreground">
                {localPaymentDialog?.user?.name ?? "este cliente"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {(
              [
                { value: "dinheiro", label: "Dinheiro" },
                { value: "pix", label: "PIX" },
                { value: "credito", label: "Cartão Crédito" },
                { value: "debito", label: "Cartão Débito" },
              ] as { value: PaymentMethod; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedLocalMethod(value)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  selectedLocalMethod === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-secondary/50"
                }`}
              >
                {label}
              </button>
            ))}
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
