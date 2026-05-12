import { Calendar, HelpCircle, Home, Scissors, Settings, UserCheck, Wallet } from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  { items: [{ icon: Home, label: "Home", href: "/home" }] },
  {
    title: "Barbeiro",
    items: [
      { icon: Calendar, label: "Agenda do dia", href: "/schedules" },
      { icon: UserCheck, label: "Clientes", href: "/customers" },
      { icon: Scissors, label: "Servicos", href: "/services" },
      { icon: Wallet, label: "Ganhos", href: "/payments" },
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
    ],
  },
  {
    items: [
      { icon: Settings, label: "Configuracoes", href: "/settings" },
      { icon: HelpCircle, label: "Ajuda", href: "/help" },
    ],
  },
];

export function BarberSidebar() {
  return <ProfileSidebar title="Painel do Barbeiro" homeHref="/home" sections={sections} />;
}
