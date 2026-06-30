import { toast } from "sonner";

import type { Appointment } from "@/service/appointmentService";
import type { BarbershopProfile } from "@/service/barbershopProfileService";

export interface WhatsAppMessageData {
  clientName: string;
  barbershopName: string;
  barberName: string;
  date: string;
  time: string;
  services: string[];
  total?: number;
  notes?: string;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateTimeBR(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "-" };
  return {
    date: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d),
  };
}

export function buildWhatsAppMessage(data: WhatsAppMessageData): string {
  const serviceList = data.services.map((s) => `  • ${s}`).join("\n");
  const totalLine =
    data.total != null && data.total > 0
      ? `\n*Total:* ${formatCurrencyBR(data.total)}`
      : "";

  const notesLine = data.notes?.trim() ? ` Observações: ${data.notes.trim()}` : "";

  return [
    `*AGENDAMENTO CONFIRMADO*`,
    ``,
    `Olá, ${data.clientName}!`,
    ``,
    `Seu agendamento foi confirmado com sucesso.`,
    ``,
    `*Barbearia:* ${data.barbershopName}`,
    `*Barbeiro:* ${data.barberName}`,
    `*Data:* ${data.date}`,
    `*Horário:* ${data.time}`,
    `*Serviços:*`,
    serviceList,
    ...(notesLine ? [notesLine] : []),
    totalLine,
    ``,
    `Aguardamos você. Obrigado pela preferência!`,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function openWhatsApp(phone: string | null | undefined, message: string): void {
  const rawPhone = phone ?? "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = formatPhone(rawPhone);

  console.log("[WhatsApp] Número recebido:", rawPhone);
  console.log("[WhatsApp] Número limpo:", cleanPhone);
  console.log("[WhatsApp] Número formatado:", formattedPhone);

  if (!formattedPhone) {
    console.warn("[WhatsApp] Nenhum número válido — abertura cancelada.");
    toast.error("WhatsApp não configurado. Acesse Configurações e cadastre o telefone da barbearia.");
    return;
  }

  const encoded = encodeURIComponent(message);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  let whatsappUrl: string;
  if (isMobile) {
    whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encoded}`;
  } else {
    whatsappUrl = `https://wa.me/${formattedPhone}?text=${encoded}`;
  }

  console.log("[WhatsApp] URL gerada:", whatsappUrl);

  if (isMobile) {
    window.location.href = whatsappUrl;
  } else {
    window.open(whatsappUrl, "_blank");
  }
}

export function openWhatsAppShare(message: string): void {
  const encoded = encodeURIComponent(message);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = `whatsapp://send?text=${encoded}`;
    return;
  }

  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

function buildConfirmationMessage(appointment: Appointment): string {
  const clientName =
    appointment.dependent?.name ??
    appointment.client?.name ??
    "Cliente";
  const { date, time } = formatDateTimeBR(appointment.startAt);
  const services = appointment.services.map((s) => s.serviceName).join(" e ");
  const barberName = appointment.barber?.displayName ?? "Barbeiro";

  return [
    `Olá ${clientName}!`,
    ``,
    `Estamos entrando em contato para CONFIRMAR seu agendamento:`,
    ``,
    ` Data: ${date}`,
    ` Horário: ${time}`,
    ` Serviço: ${services}`,
    ` Barbeiro: ${barberName}`,
    ...(appointment.notes?.trim() ? [``, ` Observação: ${appointment.notes.trim()}`] : []),
  ].join("\n");
}

export function sendAppointmentWhatsApp(
  appointment: Appointment,
  barbershop: BarbershopProfile | null,
): void {
  const clientPhone = appointment.client?.phone ?? "";
  console.log("[WhatsApp] Dados da barbearia:", barbershop);
  console.log("[WhatsApp] Telefone do cliente:", clientPhone);

  openWhatsApp(clientPhone, buildConfirmationMessage(appointment));
}
