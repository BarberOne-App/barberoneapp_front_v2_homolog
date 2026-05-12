import { Link } from "react-router-dom";
import { ArrowRight, Calendar, CreditCard, History, Scissors } from "lucide-react";

import { RecentBookings } from "@/components/RecentBookings";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "../../hooks/useAuth";

export function ClientDashboard() {
  const { user } = useAuth();
  const userName = user?.name?.trim() || "Usuario";

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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Proximo horario" value="Hoje 15:30" change="Confirmado" icon={Calendar} iconBg="bg-blue-500/10" />
        <StatCard title="Cortes realizados" value="12" change="Historico" icon={History} iconBg="bg-emerald-500/10" />
        <StatCard title="Servicos favoritos" value="3" change="Disponiveis" icon={Scissors} iconBg="bg-primary/10" />
        <StatCard title="Pagamentos" value="Em dia" change="Carteira" icon={CreditCard} iconBg="bg-purple-500/10" />
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

      <RecentBookings />
    </div>
  );
}
