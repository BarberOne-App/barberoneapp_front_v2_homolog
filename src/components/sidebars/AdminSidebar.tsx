import {
  BarChart3,
  Calendar,
  CreditCard,
  HandCoins,
  Image,
  LayoutList,
  Package,
  PlusCircle,
  Scissors,
  Settings,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  {
    items: [
      { icon: BarChart3, label: "Dashboard", href: "/overview" },
    ],
  },
  {
    title: "Operacao",
    items: [
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: Zap, label: "Encaixe", href: "/encaixe" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments" },
    ],
  },
  {
    title: "Gerenciar",
    items: [
      { icon: Scissors, label: "Servicos", href: "/services" },
      { icon: Package, label: "Produtos", href: "/products" },
      { icon: LayoutList, label: "Planos", href: "/plans" },
      { icon: Image, label: "Galeria", href: "/gallery" },
      { icon: Calendar, label: "Calendario", href: "/schedules" },
    ],
  },
  {
    title: "Administracao",
    items: [
      { icon: UserCog, label: "Funcionarios", href: "/users" },
      { icon: HandCoins, label: "Pagamento Funcionário", href: "/employee-payroll" },
      { icon: Users, label: "Clientes", href: "/customers" },
      { icon: PlusCircle, label: "Pagamentos Extras", href: "/extra-payments" },
      { icon: Settings, label: "Configuracoes", href: "/settings" },
    ],
  },
];

export function AdminSidebar() {
  return <ProfileSidebar title="Painel da Barbearia" homeHref="/home" sections={sections} />;
}
