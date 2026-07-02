import { BarChart3, Building2, CreditCard, FileText, LayoutDashboard, MessageSquareMore, Users } from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  {
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/home" },
      { icon: Building2, label: "Barbearias", href: "/barbershops" },
      { icon: Users, label: "Usuarios", href: "/users" },
      { icon: CreditCard, label: "Assinaturas", href: "/subscriptions" },
      { icon: FileText, label: "Planos Landing", href: "/platform-plans" },
      { icon: MessageSquareMore, label: "AresChat", href: "/areschat" },
      { icon: BarChart3, label: "Relatorios", href: "/reports" },
    ],
  },
];

export function SuperAdminSidebar() {
  return <ProfileSidebar title="Admin Global" homeHref="/home" sections={sections} />;
}
