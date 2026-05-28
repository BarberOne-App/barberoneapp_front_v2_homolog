import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CreditCard,
  Loader2,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import { RevenueChart } from "@/components/RevenueChart";
import { StaffPerformance } from "@/components/StaffPerformance";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "../../hooks/useAuth";
import { fetchDashboardStats, type DashboardStats } from "@/service/dashboardService";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const shortcuts = [
  {
    label: "Dashboard",
    description: "Indicadores da barbearia.",
    href: "/overview",
    icon: BarChart3,
  },
  {
    label: "Funcionarios",
    description: "Equipe e barbeiros.",
    href: "/users",
    icon: UserCog,
  },
  {
    label: "Pagamentos",
    description: "Recebimentos e planos.",
    href: "/payments",
    icon: CreditCard,
  },
];

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-2 h-3 w-24 rounded bg-muted" />
      <div className="h-7 w-20 rounded bg-muted" />
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const userName = user?.name?.trim() || "Usuario";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="rounded-xl border border-primary/20 bg-primary/10 p-6">
        <p className="mb-2 text-sm font-medium text-primary">Administrador</p>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Bem-vindo, {userName}
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Acompanhe operacao, funcionarios, pagamentos, servicos, planos e configuracoes da barbearia.
        </p>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Receita do mes"
              value={formatCurrency(stats?.revenueThisMonth ?? 0)}
              icon={Wallet}
              iconBg="bg-primary/10"
            />
            <StatCard
              title="Agendamentos hoje"
              value={String(stats?.appointmentsToday ?? 0)}
              icon={Calendar}
              iconBg="bg-blue-500/10"
            />
            <StatCard
              title="Clientes cadastrados"
              value={String(stats?.totalClients ?? 0)}
              change={stats?.newClientsThisMonth ? `+${stats.newClientsThisMonth} este mes` : undefined}
              changeType="positive"
              icon={Users}
              iconBg="bg-purple-500/10"
            />
            <StatCard
              title="Assinantes ativos"
              value={String(stats?.activeSubscriptions ?? 0)}
              change={
                stats?.monthlyRecurringRevenue
                  ? `${formatCurrency(stats.monthlyRecurringRevenue)}/mes`
                  : undefined
              }
              changeType="positive"
              icon={TrendingUp}
              iconBg="bg-emerald-500/10"
            />
          </>
        )}
      </section>

      {/* Shortcuts */}
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

      {/* Chart + Staff */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex h-80 animate-pulse items-center justify-center rounded-xl border border-border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RevenueChart
              data={stats?.revenueByDay ?? []}
              totalRevenue={stats?.revenueThisMonth ?? 0}
            />
          )}
        </div>
        <div>
          {loading ? (
            <div className="flex h-80 animate-pulse items-center justify-center rounded-xl border border-border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <StaffPerformance staff={stats?.staff ?? []} />
          )}
        </div>
      </section>
    </div>
  );
}
