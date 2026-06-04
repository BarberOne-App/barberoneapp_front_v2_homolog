import { Calendar, CreditCard, Home, Scissors, Settings, UserCheck, Zap } from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  {
    items: [{ icon: Home, label: "Home", href: "/home" }],
  },
  {
    title: "Operacao",
    items: [
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: Zap, label: "Encaixe", href: "/encaixe" },
      { icon: Calendar, label: "Agenda", href: "/schedules" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments" },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { icon: UserCheck, label: "Clientes", href: "/customers" },
      { icon: Scissors, label: "Servicos", href: "/services" },
    ],
  },
  {
    items: [
      { icon: Settings, label: "Configuracoes", href: "/settings" },
    ],
  },
];

export function ReceptionistSidebar() {
  return <ProfileSidebar title="Recepcao" homeHref="/home" sections={sections} />;
}
