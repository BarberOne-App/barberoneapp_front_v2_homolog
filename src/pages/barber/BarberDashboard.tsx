import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Scissors, Users, Wallet } from "lucide-react";

import { StatCard } from "@/components/StatCard";
import { useAuth } from "../../hooks/useAuth";

export function BarberDashboard() {
  const { user } = useAuth();
  const userName = user?.name?.trim() || "Usuario";

  const shortcuts = [
    {
      label: "Abrir agenda",
      description: "Organize os horarios do dia.",
      href: "/schedules",
      icon: Calendar,
    },
    {
      label: "Clientes",
      description: "Acesse fichas e contatos.",
      href: "/customers",
      icon: Users,
    },
    {
      label: "Servicos",
      description: "Consulte servicos vinculados.",
      href: "/services",
      icon: Scissors,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-primary/20 bg-primary/10 p-6">
        <p className="mb-2 text-sm font-medium text-primary">Barbeiro</p>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Agenda de hoje, {userName}
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Veja seus horarios, clientes atendidos, servicos e ganhos do periodo.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Agenda do dia" value="8 horarios" change="2 livres" icon={Calendar} iconBg="bg-blue-500/10" />
        <StatCard title="Clientes atendidos" value="5" change="Hoje" icon={Users} iconBg="bg-emerald-500/10" />
        <StatCard title="Servicos feitos" value="11" change="Semana" icon={Scissors} iconBg="bg-primary/10" />
        <StatCard title="Ganhos" value="R$ 680,00" change="Semana" icon={Wallet} iconBg="bg-amber-500/10" />
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

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">Proximos atendimentos</h3>
        <div className="space-y-3">
          {["09:00 - Corte masculino", "10:30 - Barba", "14:00 - Corte e barba"].map(
            (item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <span className="text-sm text-foreground">{item}</span>
                <span className="text-xs font-medium text-primary">Confirmado</span>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
