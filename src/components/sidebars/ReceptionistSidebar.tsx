import { Calendar, CreditCard, Home, LayoutList, Package, Scissors, Settings, UserCheck, Zap } from "lucide-react";

import { ProfileSidebar } from "../shared/ProfileSidebar";
import type { SidebarSection } from "../shared/ProfileSidebar";

const sections: SidebarSection[] = [
  {
    items: [{ icon: Home, label: "Home", href: "/home" }],
  },
  {
    title: "Operacao",
    items: [
      /* Agendamentos, Encaixe e Configuracoes aparecem sempre para o recepcionista.
         O acesso real é controlado pela rota (requiredPermission na rota).
         O restante fica oculto até o admin conceder a permissão. */
      { icon: Calendar, label: "Agendamentos", href: "/bookings" },
      { icon: Zap, label: "Encaixe", href: "/encaixe" },
      { icon: Calendar, label: "Agenda", href: "/schedules", requiredPermission: "manageBlockedDates" },
      { icon: CreditCard, label: "Pagamentos", href: "/payments", requiredPermission: "managePayments" },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { icon: UserCheck, label: "Clientes", href: "/customers", requiredPermission: "manageCustomers" },
    ],
  },
  {
    title: "Catalogo",
    items: [
      { icon: Scissors, label: "Servicos", href: "/services" },
      { icon: Package, label: "Produtos", href: "/products" },
      { icon: LayoutList, label: "Planos", href: "/plans" },
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
