import {
  BarChart3,
  Calendar,
  CreditCard,
  HelpCircle,
  Home,
  Package,
  Scissors,
  Settings,
  Star,
  Tag,
  UserCog,
  Users,
} from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  {
    items: [
      { icon: Home, label: "Home", href: "/home" },
      { icon: BarChart3, label: "Dashboard", href: "/overview" },
    ],
  },
  {
    title: "Operacao",
    items: [
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments" },
    ],
  },
  {
    title: "Gerenciar",
    items: [
      { icon: Scissors, label: "Servicos", href: "/services" },
      { icon: Package, label: "Produtos", href: "/products" },
      { icon: Calendar, label: "Calendario", href: "/schedules" },
      { icon: Tag, label: "Promocoes", href: "/promotions" },
      { icon: Star, label: "Avaliacoes", href: "/reviews" },
    ],
  },
  {
    title: "Administracao",
    items: [
      { icon: UserCog, label: "Funcionarios", href: "/users" },
      { icon: Users, label: "Clientes", href: "/customers" },
      { icon: Settings, label: "Configuracoes", href: "/settings" },
    ],
  },
  { items: [{ icon: HelpCircle, label: "Ajuda", href: "/help" }] },
];

export function AdminSidebar() {
  return <ProfileSidebar title="Painel da Barbearia" homeHref="/home" sections={sections} />;
}
