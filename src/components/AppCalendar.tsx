import { useEffect, useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AppCalendarProps {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  disableFuture?: boolean;
}

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function AppCalendar({
  value,
  onChange,
  placeholder = "Selecionar data",
  disabled = false,
  className,
  fromYear = new Date().getFullYear() - 100,
  toYear = new Date().getFullYear(),
  disableFuture = false,
}: AppCalendarProps) {
  const today = new Date();

  const [month, setMonth] = useState<Date>(value ?? today);
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, index) => fromYear + index
  );

  useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  function handleMonthChange(monthIndex: number) {
    const newDate = new Date(month);
    newDate.setMonth(monthIndex);
    setMonth(newDate);
    setOpenMonth(false);
  }

  function handleYearChange(year: number) {
    const newDate = new Date(month);
    newDate.setFullYear(year);
    setMonth(newDate);
    setOpenYear(false);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start rounded-xl border border-border bg-background px-4 text-left text-sm font-normal text-foreground hover:bg-secondary",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-primary" />

          {value ? (
            format(value, "dd/MM/yyyy", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-50 w-[390px] rounded-2xl border border-border bg-card p-4 shadow-xl"
      >
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-background p-3">
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setOpenMonth((prev) => !prev);
                setOpenYear(false);
              }}
              className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              {months[month.getMonth()]}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {openMonth && (
              <div className="absolute left-0 top-12 z-50 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                {months.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleMonthChange(index)}
                    className={cn(
                      "flex h-10 w-full items-center rounded-lg px-3 text-left text-sm text-foreground transition-colors hover:bg-secondary",
                      month.getMonth() === index && "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-[120px]">
            <button
              type="button"
              onClick={() => {
                setOpenYear((prev) => !prev);
                setOpenMonth(false);
              }}
              className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              {month.getFullYear()}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {openYear && (
              <div className="absolute right-0 top-12 z-50 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearChange(year)}
                    className={cn(
                      "flex h-10 w-full items-center rounded-lg px-3 text-left text-sm text-foreground transition-colors hover:bg-secondary",
                      month.getFullYear() === year &&
                        "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={ptBR}
          month={month}
          onMonthChange={setMonth}
          disabled={disableFuture ? { after: today } : undefined}
          initialFocus
          className="w-full bg-card text-foreground"
          classNames={{
            months: "flex w-full flex-col",
            month: "w-full space-y-5",
            caption: "hidden",
            caption_label: "hidden",
            nav: "hidden",

            table: "w-full border-collapse",
            head_row: "grid grid-cols-7 gap-2",
            head_cell:
              "flex h-9 items-center justify-center rounded-lg text-xs font-semibold text-muted-foreground",

            row: "mt-2 grid grid-cols-7 gap-2",
            cell:
              "relative flex h-11 w-11 items-center justify-center text-center text-sm",

            day:
              "flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium text-foreground transition-colors hover:bg-secondary focus:bg-secondary focus:outline-none",

            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",

            day_today: "border border-primary text-primary",
            day_outside: "text-muted-foreground/40 opacity-50",
            day_disabled:
              "cursor-not-allowed text-muted-foreground/30 opacity-40",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}