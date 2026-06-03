import { Calendar, Home, Scissors, Settings } from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  { items: [{ icon: Home, label: "Home", href: "/home" }] },
  {
    title: "Cliente",
    items: [
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: Scissors, label: "Servicos", href: "/services" },
    ],
  },
  {
    items: [
      { icon: Settings, label: "Configuracoes", href: "/settings" },
    ],
  },
];

export function ClientSidebar() {
  return <ProfileSidebar title="Area do Cliente" homeHref="/home" sections={sections} />;
}
