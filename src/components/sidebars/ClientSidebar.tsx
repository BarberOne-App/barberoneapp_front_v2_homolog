import { Calendar, CreditCard, HelpCircle, History, Home, Scissors, Settings, Star } from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  { items: [{ icon: Home, label: "Home", href: "/home" }] },
  {
    title: "Cliente",
    items: [
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: History, label: "Historico", href: "/bookings" },
      { icon: Scissors, label: "Servicos", href: "/services" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments" },
      { icon: Star, label: "Avaliacoes", href: "/reviews" },
    ],
  },
  {
    items: [
      { icon: Settings, label: "Configuracoes", href: "/settings" },
      { icon: HelpCircle, label: "Ajuda", href: "/help" },
    ],
  },
];

export function ClientSidebar() {
  return <ProfileSidebar title="Area do Cliente" homeHref="/home" sections={sections} />;
}
