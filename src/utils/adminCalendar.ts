import type { Appointment } from "@/service/appointmentService";
import type { Barber } from "@/service/barberService";

export interface CalendarColor {
  accent: string;
  tint: string;
  tintStrong: string;
  border: string;
  cardBg: string;
  cardText: string;
}

export interface CalendarAppointment extends Appointment {
  startTime: string;
  duration: number;
  color: CalendarColor;
  isFitAppointment: boolean;
  visibleNotes: string;
  index: number;
}

export interface FreeSlot {
  startMinutes: number;
  durationMinutes: number;
}

export const BARBER_CALENDAR_COLORS: CalendarColor[] = [
  { accent: '#38bdf8', tint: 'rgba(56,189,248,0.05)',  tintStrong: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.30)',  cardBg: 'rgba(8,47,73,0.90)',   cardText: '#bae6fd' },
  { accent: '#fb923c', tint: 'rgba(251,146,60,0.05)',  tintStrong: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.30)',  cardBg: 'rgba(67,20,7,0.90)',   cardText: '#fed7aa' },
  { accent: '#f472b6', tint: 'rgba(244,114,182,0.05)', tintStrong: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.30)', cardBg: 'rgba(80,7,36,0.90)',   cardText: '#fbcfe8' },
  { accent: '#22d3ee', tint: 'rgba(34,211,238,0.05)',  tintStrong: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.30)',  cardBg: 'rgba(8,51,68,0.90)',   cardText: '#a5f3fc' },
  { accent: '#a78bfa', tint: 'rgba(167,139,250,0.05)', tintStrong: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.30)', cardBg: 'rgba(46,16,101,0.90)', cardText: '#ddd6fe' },
  { accent: '#818cf8', tint: 'rgba(129,140,248,0.05)', tintStrong: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.30)', cardBg: 'rgba(30,27,75,0.90)',  cardText: '#c7d2fe' },
  { accent: '#2dd4bf', tint: 'rgba(45,212,191,0.05)',  tintStrong: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.30)',  cardBg: 'rgba(19,78,74,0.90)',  cardText: '#99f6e4' },
  { accent: '#e879f9', tint: 'rgba(232,121,249,0.05)', tintStrong: 'rgba(232,121,249,0.12)', border: 'rgba(232,121,249,0.30)', cardBg: 'rgba(74,4,78,0.90)',   cardText: '#f0abfc' },
];

export const FIT_APPOINTMENT_NOTE_MARKER = '[barberone:fit]';

export const FIT_APPOINTMENT_COLOR: CalendarColor = {
  accent: '#0ea5e9',
  border: 'rgba(14,165,233,0.56)',
  cardBg: 'rgba(7,89,133,0.94)',
  cardText: '#e0f2fe',
  tint: 'rgba(14,165,233,0.055)',
  tintStrong: 'rgba(14,165,233,0.13)',
};

export const CALENDAR_SLOT_HEIGHT = 14;
export const CALENDAR_MINUTES_PER_SLOT = 5;
export const CALENDAR_FIT_SLOT_MAX_MINUTES = 40;
export const CALENDAR_START_MINUTES = 8 * 60;
export const CALENDAR_END_MINUTES = 20 * 60;

export const getStableCalendarColor = (barber: Barber | { id?: string; displayName?: string; name?: string } | null, fallbackIndex = 0): CalendarColor => {
  const value = String((barber as any)?.id ?? (barber as any)?.displayName ?? (barber as any)?.name ?? fallbackIndex);
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return BARBER_CALENDAR_COLORS[hash % BARBER_CALENDAR_COLORS.length]!;
};

export const isFitAppointment = (appointment: Appointment | null | undefined): boolean =>
  String((appointment as any)?.notes || '').includes(FIT_APPOINTMENT_NOTE_MARKER);

export const getVisibleAppointmentNotes = (notes: string | null | undefined): string =>
  String(notes || '').replace(FIT_APPOINTMENT_NOTE_MARKER, '').trim();

export const getLocalDateKey = (date: Date | null | undefined): string =>
  date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-CA') : '';

export const minutesToTime = (minutes: number): string => {
  const safe = Math.max(0, Number(minutes) || 0);
  const hh = String(Math.floor(safe / 60)).padStart(2, '0');
  const mm = String(safe % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const buildCalendarTimeSlots = (
  startMinutes = CALENDAR_START_MINUTES,
  endMinutes = CALENDAR_END_MINUTES,
  stepMinutes = CALENDAR_MINUTES_PER_SLOT,
): string[] => {
  const slots: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m += stepMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
};

export const getAppointmentDurationMinutes = (
  apt: Appointment,
  getStartDate: (a: Appointment) => Date | null,
): number => {
  const startDate = getStartDate(apt);
  const endRaw = (apt as any).endAt || (apt as any).end_at;
  const endDate = endRaw ? new Date(endRaw) : null;

  if (startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate > startDate) {
    return Math.max(5, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  }

  if (Array.isArray(apt.services) && apt.services.length > 0) {
    return apt.services.reduce((sum, s) => {
      const d = Number((s as any).durationMinutes ?? (s as any).duration_minutes ?? (s as any).duration ?? 30);
      const q = Number((s as any).quantity ?? 1);
      return sum + (Number.isFinite(d) && d > 0 ? d : 30) * (Number.isFinite(q) && q > 0 ? q : 1);
    }, 0);
  }

  return 30;
};

export const buildCalendarAppointmentsByBarber = ({
  appointments,
  barbers,
  activeDateKey,
  barberColors,
  getAppointmentStartDate,
}: {
  appointments: Appointment[];
  barbers: Barber[];
  activeDateKey: string;
  barberColors: Map<string, CalendarColor>;
  getAppointmentStartDate: (a: Appointment) => Date | null;
}): Map<string, CalendarAppointment[]> => {
  const map = new Map<string, CalendarAppointment[]>();
  barbers.forEach((b) => map.set(b.id, []));

  appointments.forEach((appointment, index) => {
    const startDate = getAppointmentStartDate(appointment);
    if (!startDate || getLocalDateKey(startDate) !== activeDateKey) return;

    const barberId = appointment.barberId || appointment.barber?.id;
    if (!barberId) return;

    if (!map.has(barberId)) map.set(barberId, []);

    const startTime = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const duration = getAppointmentDurationMinutes(appointment, getAppointmentStartDate);
    const isFit = isFitAppointment(appointment);
    const color = isFit
      ? FIT_APPOINTMENT_COLOR
      : (barberColors.get(barberId) ?? getStableCalendarColor(appointment.barber ?? { id: barberId }, index));

    map.get(barberId)!.push({
      ...appointment,
      startTime,
      duration,
      color,
      isFitAppointment: isFit,
      visibleNotes: getVisibleAppointmentNotes(appointment.notes),
      index,
    });
  });

  return map;
};

interface CreateFreeSlotParams {
  freeSlots: FreeSlot[];
  gapStart: number;
  gapEnd: number;
  minutesPerSlot: number;
  fitSlotMaxMinutes: number;
  endMinutes: number;
}

const normalizeMinutesToStep = (minutes: number, step: number): number => {
  const safeStep = Number(step) > 0 ? Number(step) : CALENDAR_MINUTES_PER_SLOT;
  return Math.ceil(Number(minutes) / safeStep) * safeStep;
};

const createFreeFitSlot = ({ freeSlots, gapStart, gapEnd, minutesPerSlot, fitSlotMaxMinutes, endMinutes }: CreateFreeSlotParams): void => {
  const normalizedStart = normalizeMinutesToStep(gapStart, minutesPerSlot);
  const normalizedEnd = Math.min(gapEnd, endMinutes);
  const gap = normalizedEnd - normalizedStart;

  if (gap < minutesPerSlot) return;

  const durationMinutes = Math.min(fitSlotMaxMinutes, Math.floor(gap / minutesPerSlot) * minutesPerSlot);
  if (durationMinutes < minutesPerSlot) return;

  freeSlots.push({ startMinutes: normalizedStart, durationMinutes });
};

export const buildCalendarFreeSlotsByBarber = ({
  barbers,
  appointmentsByBarber,
  startMinutes = CALENDAR_START_MINUTES,
  endMinutes = CALENDAR_END_MINUTES,
  minutesPerSlot = CALENDAR_MINUTES_PER_SLOT,
  fitSlotMaxMinutes = CALENDAR_FIT_SLOT_MAX_MINUTES,
  nowMinutes = null,
}: {
  barbers: Barber[];
  appointmentsByBarber: Map<string, CalendarAppointment[]>;
  startMinutes?: number;
  endMinutes?: number;
  minutesPerSlot?: number;
  fitSlotMaxMinutes?: number;
  nowMinutes?: number | null;
}): Map<string, FreeSlot[]> => {
  const map = new Map<string, FreeSlot[]>();

  barbers.forEach((barber) => {
    const apts = (appointmentsByBarber.get(barber.id) || [])
      .map((apt) => {
        const [h, m] = String(apt.startTime || '00:00').split(':').map(Number);
        const startM = (h ?? 0) * 60 + (m ?? 0);
        let duration = Number(apt.duration || 0);

        if (!(duration > 0)) {
          const endAtRaw = (apt as any).endAt || (apt as any).end_at;
          const startAtRaw = (apt as any).startAt || (apt as any).start_at;
          if (endAtRaw && startAtRaw) {
            const diff = Math.round((new Date(endAtRaw).getTime() - new Date(startAtRaw).getTime()) / 60000);
            if (diff > 0) duration = diff;
          }
        }

        if (!(duration > 0) && Array.isArray(apt.services) && apt.services.length > 0) {
          duration = apt.services.reduce((sum, s) => {
            const d = Number((s as any).durationMinutes ?? (s as any).duration_minutes ?? (s as any).duration ?? 30);
            const q = Number((s as any).quantity ?? 1);
            return sum + (Number.isFinite(d) && d > 0 ? d : 30) * (Number.isFinite(q) && q > 0 ? q : 1);
          }, 0);
        }

        if (!(duration > 0)) duration = minutesPerSlot;

        return { startM, endM: startM + duration, duration, isFitAppointment: apt.isFitAppointment };
      })
      .filter((a) => Number.isFinite(a.startM) && Number.isFinite(a.endM) && a.duration > 0 && a.endM > startMinutes && a.startM < endMinutes)
      .map((a) => ({ ...a, startM: Math.max(a.startM, startMinutes), endM: Math.min(a.endM, endMinutes) }))
      .sort((a, b) => a.startM - b.startM);

    const freeSlots: FreeSlot[] = [];

    if (apts.length === 0) {
      map.set(barber.id, freeSlots);
      return;
    }

    let cursor = nowMinutes !== null ? Math.max(startMinutes, nowMinutes) : startMinutes;

    apts.forEach((apt) => {
      if (apt.startM > cursor) {
        createFreeFitSlot({ freeSlots, gapStart: cursor, gapEnd: apt.startM, minutesPerSlot, fitSlotMaxMinutes, endMinutes });
      }
      cursor = Math.max(cursor, apt.endM);
    });

    if (cursor < endMinutes) {
      createFreeFitSlot({ freeSlots, gapStart: cursor, gapEnd: endMinutes, minutesPerSlot, fitSlotMaxMinutes, endMinutes });
    }

    map.set(barber.id, freeSlots);
  });

  return map;
};
