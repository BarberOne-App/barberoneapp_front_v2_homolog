import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarberEarningsPage } from "@/pages/barber/BarberEarningsPage";
import { listAppointments, type Appointment } from "@/service/appointmentService";
import { listBarbers, type Barber } from "@/service/barberService";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function apiMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return (
    message ||
    (error instanceof Error
      ? error.message
      : "Não foi possível carregar os barbeiros.")
  );
}

async function listAllAppointments() {
  const limit = 100;
  const first = await listAppointments({ allAppointments: true, page: 1, limit });
  const items: Appointment[] = [...first.items];
  const pages = Math.ceil(first.total / limit);

  for (let page = 2; page <= pages; page += 1) {
    const result = await listAppointments({ allAppointments: true, page, limit });
    items.push(...result.items);
  }

  return items;
}

async function listAllBarbers() {
  const limit = 100;
  const first = await listBarbers({ page: 1, limit });
  const items: Barber[] = [...first.items];
  const pages = Math.ceil(first.total / limit);

  for (let page = 2; page <= pages; page += 1) {
    const result = await listBarbers({ page, limit });
    items.push(...result.items);
  }

  return items;
}

export function EmployeeAppointmentHistoryPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});
  const [barberId, setBarberId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [barberItems, appointments] = await Promise.all([
          listAllBarbers(),
          listAllAppointments(),
        ]);
        setBarbers(barberItems);
        setAppointmentCounts(
          appointments.reduce<Record<string, number>>((counts, appointment) => {
            counts[appointment.barberId] = (counts[appointment.barberId] ?? 0) + 1;
            return counts;
          }, {}),
        );
      } catch (error) {
        toast.error(apiMessage(error));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === barberId),
    [barberId, barbers],
  );

  if (selectedBarber) {
    return (
      <BarberEarningsPage
        barberOverride={selectedBarber}
        onBack={() => setBarberId("")}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Histórico de atendimentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione um barbeiro para consultar seus ganhos e atendimentos.
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-xl border bg-card py-16">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Barbeiros</h2>
            <p className="text-xs text-muted-foreground">
              Clique em um barbeiro para abrir o histórico completo.
            </p>
          </div>
          {barbers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Nenhum barbeiro encontrado.
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {barbers.map((barber) => {
                const count = appointmentCounts[barber.id] ?? 0;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => setBarberId(barber.id)}
                    className="flex items-center gap-3 rounded-xl border p-4 text-left transition hover:border-primary/50 hover:bg-muted/40"
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage
                        src={barber.photoUrl ?? undefined}
                        alt={barber.displayName}
                      />
                      <AvatarFallback>{initials(barber.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{barber.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} atendimento{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
