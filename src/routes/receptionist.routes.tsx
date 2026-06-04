import { ReceptionistDashboard } from "../pages/receptionist/ReceptionistDashboard";
import { ReceptionistSettingsPage } from "../pages/receptionist/ReceptionistSettingsPage";
import { BookingsPage } from "../pages/shared/BookingsPage";
import { CustomersPage } from "../pages/shared/CustomersPage";
import { FitAppointmentPage } from "../pages/shared/FitAppointmentPage";
import { PaymentsPage } from "../pages/shared/PaymentsPage";
import { SchedulesPage } from "../pages/shared/SchedulesPage";
import { ServicesPage } from "../pages/shared/ServicesPage";
import type { AppRoute } from "./types";

export const receptionistRoutes: AppRoute[] = [
  {
    path: "/home",
    title: "Home",
    breadcrumbs: ["Recepcao", "Home"],
    Component: ReceptionistDashboard,
  },
  {
    path: "/bookings",
    title: "Agendamentos",
    breadcrumbs: ["Operacao", "Agendamentos"],
    Component: BookingsPage,
  },
  {
    path: "/encaixe",
    title: "Encaixe",
    breadcrumbs: ["Operacao", "Encaixe"],
    Component: FitAppointmentPage,
  },
  {
    path: "/schedules",
    title: "Agenda",
    breadcrumbs: ["Operacao", "Agenda"],
    Component: SchedulesPage,
  },
  {
    path: "/payments",
    title: "Pagamentos",
    breadcrumbs: ["Operacao", "Pagamentos"],
    Component: PaymentsPage,
  },
  {
    path: "/customers",
    title: "Clientes",
    breadcrumbs: ["Atendimento", "Clientes"],
    Component: CustomersPage,
  },
  {
    path: "/services",
    title: "Servicos",
    breadcrumbs: ["Atendimento", "Servicos"],
    Component: ServicesPage,
  },
  {
    path: "/settings",
    title: "Configuracoes",
    breadcrumbs: ["Recepcao", "Configuracoes"],
    Component: ReceptionistSettingsPage,
  },
];
