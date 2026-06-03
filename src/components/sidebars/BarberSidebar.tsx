import { Calendar, Home, Scissors, Settings, UserCheck, Wallet } from "lucide-react";

import { usePermissions } from "../../hooks/usePermissions";
import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarItem, SidebarSection } from "../shared/ProfileSidebar";

export function BarberSidebar() {
  const { can } = usePermissions();

  const barberItems: SidebarItem[] = [
    { icon: Calendar, label: "Agenda do dia", href: "/schedules" },
    { icon: Calendar, label: "Agendamentos", href: "/bookings" },
    { icon: UserCheck, label: "Clientes", href: "/customers" },
    { icon: Scissors, label: "Servicos", href: "/services" },
    { icon: Wallet, label: "Ganhos", href: "/payments" },
  ];

  const bottomItems: SidebarItem[] = [];

  if (can("manageSettings")) {
    bottomItems.push({ icon: Settings, label: "Configuracoes", href: "/settings" });
  }

  const sections: SidebarSection[] = [
    { items: [{ icon: Home, label: "Home", href: "/home" }] },
    { title: "Barbeiro", items: barberItems },
    ...(bottomItems.length > 0 ? [{ items: bottomItems }] : []),
  ];

  return <ProfileSidebar title="Painel do Barbeiro" homeHref="/home" sections={sections} />;
}
