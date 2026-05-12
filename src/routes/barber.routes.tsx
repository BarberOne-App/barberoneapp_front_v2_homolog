import { BarberDashboard } from "../pages/barber/BarberDashboard";
import { BarberSettingsPage } from "../pages/barber/BarberSettingsPage";
import { BookingsPage } from "../pages/shared/BookingsPage";
import { CustomersPage } from "../pages/shared/CustomersPage";
import { HelpCenterPage } from "../pages/shared/HelpCenterPage";
import { PaymentsPage } from "../pages/shared/PaymentsPage";
import { SchedulesPage } from "../pages/shared/SchedulesPage";
import { ServicesPage } from "../pages/shared/ServicesPage";
import type { AppRoute } from "./types";

export const barberRoutes: AppRoute[] = [
  {
    path: "/home",
    title: "Home",
    breadcrumbs: ["Barbeiro", "Home"],
    Component: BarberDashboard,
  },
  {
    path: "/schedules",
    title: "Agenda do dia",
    breadcrumbs: ["Barbeiro", "Agenda"],
    Component: SchedulesPage,
  },
  {
    path: "/customers",
    title: "Clientes",
    breadcrumbs: ["Barbeiro", "Clientes"],
    Component: CustomersPage,
  },
  {
    path: "/services",
    title: "Servicos",
    breadcrumbs: ["Barbeiro", "Servicos"],
    Component: ServicesPage,
  },
  {
    path: "/payments",
    title: "Ganhos",
    breadcrumbs: ["Barbeiro", "Ganhos"],
    Component: PaymentsPage,
  },
  {
    path: "/bookings",
    title: "Agendamentos",
    breadcrumbs: ["Barbeiro", "Agendamentos"],
    Component: BookingsPage,
  },
  {
    path: "/settings",
    title: "Configuracoes",
    breadcrumbs: ["Barbeiro", "Configuracoes"],
    Component: BarberSettingsPage,
  },
  {
    path: "/help",
    title: "Central de Ajuda",
    breadcrumbs: ["Barbeiro", "Ajuda"],
    Component: HelpCenterPage,
  },
];
