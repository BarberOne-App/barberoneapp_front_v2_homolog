import {
  BarChart3,
  Calendar,
  CircleDollarSign,
  CreditCard,
  BanknoteArrowDown,
  HandCoins,
  Image,
  LayoutList,
  Package,
  PlusCircle,
  Scissors,
  Settings,
  UserCog,
  Users,
  UserX,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";
import { getSettings } from "@/service/settingsService";

function buildSections(showSubscriptionCommissions: boolean): SidebarSection[] {
  return [
    {
      items: [
        { icon: BarChart3, label: "Dashboard", href: "/overview" },
      ],
    },
    {
      items: [
        {
          icon: Calendar,
          label: "Operacao",
          children: [
            { icon: Calendar, label: "Agendamentos", href: "/bookings" },
            { icon: Zap, label: "Agenda", href: "/encaixe" },
            { icon: Calendar, label: "Calendario", href: "/schedules" },
          ],
        },
      ],
    },
    {
      items: [
        {
          icon: CreditCard,
          label: "Financeiro",
          children: [
            { icon: CreditCard, label: "Pagamentos", href: "/payments" },
            { icon: CircleDollarSign, label: "Fechamento de caixa", href: "/cash-closing" },
            { icon: HandCoins, label: "Pagamento Funcionario", href: "/employee-payroll" },
            ...(showSubscriptionCommissions
              ? [{ icon: CircleDollarSign, label: "Comissoes Plano", href: "/subscription-commissions" }]
              : []),
            { icon: PlusCircle, label: "Pagamentos Extras", href: "/extra-payments" },
          ],
        },
      ],
    },
    {
      items: [
        {
          icon: Scissors,
          label: "Gerenciar",
          children: [
            { icon: Scissors, label: "Servicos", href: "/services" },
            { icon: Package, label: "Produtos", href: "/products" },
            { icon: Image, label: "Galeria", href: "/gallery" },
          ],
        },
      ],
    },
    {
      items: [
        {
          icon: LayoutList,
          label: "Assinaturas",
          children: [
            { icon: LayoutList, label: "Planos", href: "/plans" },
            { icon: Users, label: "Assinantes", href: "/subscriptions" },
            { icon: Calendar, label: "Calendario de Recebiveis", href: "/subscription-receivables" },
            { icon: UserX, label: "Inadimplentes", href: "/subscription-defaulters" },
            { icon: BanknoteArrowDown, label: "Solicitar Saque", href: "/subscription-withdrawals" },
          ],
        },
      ],
    },
    {
      items: [
        {
          icon: UserCog,
          label: "Administracao",
          children: [
            { icon: UserCog, label: "Funcionarios", href: "/users" },
            { icon: Users, label: "Clientes", href: "/customers" },
            { icon: Settings, label: "Configuracoes", href: "/settings" },
          ],
        },
      ],
    },
  ];
}

export function AdminSidebar() {
  const [showSubscriptionCommissions, setShowSubscriptionCommissions] = useState(false);
  const sections = useMemo(
    () => buildSections(showSubscriptionCommissions),
    [showSubscriptionCommissions],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (isMounted) {
          setShowSubscriptionCommissions(settings.subscriptionBarberRule === "free_choice");
        }
      } catch {
        if (isMounted) setShowSubscriptionCommissions(false);
      }
    }

    void loadSettings();
    window.addEventListener("barbershop:updated", loadSettings);

    return () => {
      isMounted = false;
      window.removeEventListener("barbershop:updated", loadSettings);
    };
  }, []);

  return <ProfileSidebar title="Painel da Barbearia" homeHref="/home" sections={sections} />;
}
