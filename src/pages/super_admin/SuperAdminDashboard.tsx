import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Building2, Settings, Shield, Users, Wallet } from "lucide-react";

import { RevenueChart } from "@/components/RevenueChart";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "../../hooks/useAuth";

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const userName = user?.name?.trim() || "Usuario";

  const shortcuts = [
    {
      label: "Metricas gerais",
      description: "Indicadores consolidados.",
      href: "/overview",
      icon: BarChart3,
    },
    {
      label: "Usuarios globais",
      description: "Contas e permissoes.",
      href: "/users",
      icon: Users,
    },
    {
      label: "Configuracoes",
      description: "Parametros administrativos.",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-primary/20 bg-primary/10 p-6">
        <p className="mb-2 text-sm font-medium text-primary">Super Admin</p>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Visao global, {userName}
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Monitore barbearias cadastradas, usuarios, metricas gerais e configuracoes administrativas.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Barbearias" value="48" change="Ativas" icon={Building2} iconBg="bg-blue-500/10" />
        <StatCard title="Usuarios" value="9.842" change="Global" icon={Users} iconBg="bg-emerald-500/10" />
        <StatCard title="Receita plataforma" value="R$ 82.410,00" change="Mes" icon={Wallet} iconBg="bg-primary/10" />
        <StatCard title="Alertas" value="3" change="Administrativo" icon={Shield} iconBg="bg-amber-500/10" />
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold text-foreground">Barbearias recentes</h3>
          <div className="space-y-3">
            {["Barbearia Rodrigues", "BarberOne Centro", "Studio Premium"].map((name) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{name}</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500">
                  ativa
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold text-foreground">Metricas gerais</h3>
          <RevenueChart />
        </div>
      </section>
    </div>
  );
}
