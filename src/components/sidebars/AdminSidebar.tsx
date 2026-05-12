import {
  BarChart3,
  Calendar,
  CreditCard,
  HelpCircle,
  Home,
  Lock,
  Package,
  Scissors,
  Settings,
  Shield,
  Star,
  Tag,
  User,
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
      { icon: Users, label: "Clientes", href: "/customers" },
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments" },
    ],
  },
  {
    title: "Gerenciar",
    items: [
      { icon: UserCog, label: "Funcionarios", href: "/staff" },
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
      { icon: User, label: "Usuarios", href: "/users" },
      { icon: Shield, label: "Perfis", href: "/roles" },
      { icon: Lock, label: "Permissoes", href: "/permissions" },
      { icon: Settings, label: "Configuracoes", href: "/settings" },
    ],
  },
  { items: [{ icon: HelpCircle, label: "Ajuda", href: "/help" }] },
];

export function AdminSidebar() {
  return <ProfileSidebar title="Painel da Barbearia" homeHref="/home" sections={sections} />;
}
