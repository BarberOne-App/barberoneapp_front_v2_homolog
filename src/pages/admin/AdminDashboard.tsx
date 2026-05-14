import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Calendar, CreditCard, Scissors, UserCog, Users, Wallet } from "lucide-react";

import { RevenueChart } from "@/components/RevenueChart";
import { StaffPerformance } from "@/components/StaffPerformance";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "../../hooks/useAuth";

export function AdminDashboard() {
  const { user } = useAuth();
  const userName = user?.name?.trim() || "Usuario";

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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-primary/20 bg-primary/10 p-6">
        <p className="mb-2 text-sm font-medium text-primary">Administrador</p>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Bem-vindo, {userName}
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Acompanhe operacao, funcionarios, pagamentos, servicos, planos e configuracoes da barbearia.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Receita total" value="R$ 23.249,00" change="15.5%" changeType="positive" icon={Wallet} iconBg="bg-primary/10" />
        <StatCard title="Agendamentos" value="2.095" change="10.5%" changeType="negative" icon={Calendar} iconBg="bg-blue-500/10" />
        <StatCard title="Servicos ativos" value="27" change="8.5%" changeType="positive" icon={Scissors} iconBg="bg-emerald-500/10" />
        <StatCard title="Clientes ativos" value="1.247" change="12.3%" changeType="positive" icon={Users} iconBg="bg-purple-500/10" />
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <StaffPerformance />
      </section>
    </div>
  );
}
