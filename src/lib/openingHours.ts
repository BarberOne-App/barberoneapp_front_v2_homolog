export type OpeningHoursDay = {
  weekday: number;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
};

export const WEEKDAY_LABELS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

export function getOpeningHoursError(days: OpeningHoursDay[]): string | null {
  if (days.length !== 7 || WEEKDAY_LABELS.some((_, weekday) => days.filter((day) => day.weekday === weekday).length !== 1)) {
    return 'Não foi possível carregar os horários de funcionamento. Recarregue a página e tente novamente.';
  }
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const day of days) {
    if (day.isOpen && (!timePattern.test(day.opensAt) || !timePattern.test(day.closesAt) || day.opensAt >= day.closesAt)) {
      return `${WEEKDAY_LABELS[day.weekday]}: informe abertura e fechamento, com fechamento após a abertura no mesmo dia.`;
    }
  }
  return null;
}
