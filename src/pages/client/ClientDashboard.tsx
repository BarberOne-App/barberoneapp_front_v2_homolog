import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, CreditCard, History, Scissors } from "lucide-react";

import { BannerCarousel } from "@/components/BannerCarousel";
import { RecentBookings } from "@/components/RecentBookings";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "../../hooks/useAuth";
import { listAppointments } from "@/service/appointmentService";
import type { DashboardAppointment } from "@/service/dashboardService";

function formatNextAppointment(startAt: string): string {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return "—";

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (isToday) return `Hoje ${time}`;

  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);

  return `${dayMonth} ${time}`;
}

export function ClientDashboard() {
  const { user } = useAuth();
  const userName = user?.name?.trim() || "Usuario";

  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [nextAppointment, setNextAppointment] = useState<string>("—");
  const [completedCount, setCompletedCount] = useState<number | string>("—");
  const [upcomingCount, setUpcomingCount] = useState<number | string>("—");

  useEffect(() => {
    if (!user?.id) return;

    listAppointments({ clientId: user.id, limit: 50 })
      .then((res) => {
        const mapped: DashboardAppointment[] = res.items.map((a) => ({
          id: a.id,
          startAt: a.startAt,
          status: a.status,
          clientName: a.client?.name ?? "—",
          barberName: a.barber?.displayName ?? "—",
          serviceLabel: a.services[0]?.serviceName ?? "—",
          serviceCount: a.services.length,
        }));
        setAppointments(mapped);

        const now = new Date();
        const upcoming = res.items.filter(
          (a) =>
            (a.status === "scheduled" || a.status === "confirmed") &&
            new Date(a.startAt) >= now,
        );
        upcoming.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        setNextAppointment(
          upcoming.length > 0 ? formatNextAppointment(upcoming[0]!.startAt) : "Nenhum",
        );
        setUpcomingCount(upcoming.length);
        setCompletedCount(res.items.filter((a) => a.status === "completed").length);
      })
      .catch(() => {
        setAppointments([]);
        setNextAppointment("—");
      });
  }, [user?.id]);

  const shortcuts = [
    {
      label: "Marcar horario",
      description: "Escolha servico, barbeiro e data.",
      href: "/bookings",
      icon: Calendar,
    },
    {
      label: "Ver historico",
      description: "Consulte agendamentos anteriores.",
      href: "/bookings",
      icon: History,
    },
    {
      label: "Servicos",
      description: "Veja opcoes disponiveis.",
      href: "/services",
      icon: Scissors,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-primary/20 bg-primary/10 p-6">
        <p className="mb-2 text-sm font-medium text-primary">Cliente</p>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Ola, {userName}
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Acompanhe seus agendamentos, historico e proximas opcoes para marcar horario.
        </p>
      </section>

      <BannerCarousel />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Proximo horario"
          value={nextAppointment}
          change="Agendado"
          icon={Calendar}
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Proximos agendamentos"
          value={String(upcomingCount)}
          change="Confirmados e agendados"
          icon={History}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          title="Cortes realizados"
          value={String(completedCount)}
          change="Historico"
          icon={Scissors}
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Pagamentos"
          value="Ver"
          change="Historico de pagamentos"
          icon={CreditCard}
          iconBg="bg-purple-500/10"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.label}
            to={shortcut.href}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <shortcut.icon size={20} />
              </div>
              <ArrowRight
                size={18}
                className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
              />
            </div>
            <h3 className="text-base font-semibold text-foreground">{shortcut.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{shortcut.description}</p>
          </Link>
        ))}
      </section>

      <RecentBookings appointments={appointments} />
    </div>
  );
}
