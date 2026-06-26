import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import barberOneLogo from "@/assets/image/barberOne-logo.png";
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
