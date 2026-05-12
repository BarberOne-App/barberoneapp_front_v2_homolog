import {
  BarChart3,
  Building2,
  CreditCard,
  HelpCircle,
  Home,
  Lock,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  {
    items: [
      { icon: Home, label: "Home", href: "/home" },
      { icon: BarChart3, label: "Metricas gerais", href: "/overview" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: Building2, label: "Barbearias", href: "/barbershops" },
      { icon: Users, label: "Usuarios", href: "/users" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments" },
    ],
  },
  {
    title: "Administracao",
    items: [
      { icon: Shield, label: "Perfis", href: "/roles" },
      { icon: Lock, label: "Permissoes", href: "/permissions" },
      { icon: Settings, label: "Configuracoes", href: "/settings" },
    ],
  },
  { items: [{ icon: HelpCircle, label: "Ajuda", href: "/help" }] },
];

export function SuperAdminSidebar() {
  return <ProfileSidebar title="Admin Global" homeHref="/home" sections={sections} />;
}
