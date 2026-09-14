import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WEEKDAY_LABELS, type OpeningHoursDay } from '@/lib/openingHours';

type Props = {
  value: OpeningHoursDay[];
  onChange: (value: OpeningHoursDay[]) => void;
  disabled?: boolean;
};

export function OpeningHoursEditor({ value, onChange, disabled }: Props) {
  function updateDay(weekday: number, change: Partial<OpeningHoursDay>) {
    onChange(value.map((day) => day.weekday === weekday ? { ...day, ...change } : day));
  }

  if (value.length !== 7) {
    return <p className="text-sm text-muted-foreground" role="status">
      {disabled ? 'Carregando horários de funcionamento...' : 'Não foi possível carregar os horários. Recarregue a página e tente novamente.'}
    </p>;
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {WEEKDAY_LABELS.map((label, weekday) => {
        const day = value.find((item) => item.weekday === weekday)!;
        const invalidRange = day.isOpen && (!day.opensAt || !day.closesAt || day.opensAt >= day.closesAt);
        return (
          <fieldset key={weekday} disabled={disabled} className="min-w-0 space-y-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium text-foreground">{label}</legend>
            <div className="flex items-center gap-2">
              <Switch id={`opening-day-${weekday}`} checked={day.isOpen}
                aria-label={`${label}: aberto ou fechado`} disabled={disabled}
                onCheckedChange={(isOpen) => updateDay(weekday, { isOpen })} />
              <Label htmlFor={`opening-day-${weekday}`} className="text-sm">{day.isOpen ? 'Aberto' : 'Fechado'}</Label>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`opening-start-${weekday}`}>Abertura</Label>
                <Input id={`opening-start-${weekday}`} type="time" step={60}
                  className="min-w-0 w-full" value={day.opensAt} disabled={disabled || !day.isOpen}
                  aria-invalid={invalidRange} aria-describedby={invalidRange ? `opening-error-${weekday}` : undefined}
                  onChange={(event) => updateDay(weekday, { opensAt: event.target.value })} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`opening-end-${weekday}`}>Fechamento</Label>
                <Input id={`opening-end-${weekday}`} type="time" step={60}
                  className="min-w-0 w-full" value={day.closesAt} disabled={disabled || !day.isOpen}
                  aria-invalid={invalidRange} aria-describedby={invalidRange ? `opening-error-${weekday}` : undefined}
                  onChange={(event) => updateDay(weekday, { closesAt: event.target.value })} />
              </div>
            </div>
            {invalidRange && <p id={`opening-error-${weekday}`} className="text-xs text-destructive" role="alert">
              Informe um fechamento após a abertura, no mesmo dia.
            </p>}
          </fieldset>
        );
      })}
    </div>
  );
}
