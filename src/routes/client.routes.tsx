import { ClientDashboard } from "../pages/client/ClientDashboard";
import { BookingsPage } from "../pages/shared/BookingsPage";
import { HelpCenterPage } from "../pages/shared/HelpCenterPage";
import { PaymentsPage } from "../pages/shared/PaymentsPage";
import { ReviewsPage } from "../pages/shared/ReviewsPage";
import { ServicesPage } from "../pages/shared/ServicesPage";
import { SettingsPage } from "../pages/shared/SettingsPage";
import type { AppRoute } from "./types";

export const clientRoutes: AppRoute[] = [
  {
    path: "/home",
    title: "Home",
    breadcrumbs: ["Cliente", "Home"],
    Component: ClientDashboard,
  },
  {
    path: "/bookings",
    title: "Agendamentos",
    breadcrumbs: ["Cliente", "Agendamentos"],
    Component: BookingsPage,
  },
  {
    path: "/services",
    title: "Servicos",
    breadcrumbs: ["Cliente", "Servicos"],
    Component: ServicesPage,
  },
  {
    path: "/payments",
    title: "Pagamentos",
    breadcrumbs: ["Cliente", "Pagamentos"],
    Component: PaymentsPage,
  },
  {
    path: "/reviews",
    title: "Avaliacoes",
    breadcrumbs: ["Cliente", "Avaliacoes"],
    Component: ReviewsPage,
  },
  {
    path: "/settings",
    title: "Configuracoes",
    breadcrumbs: ["Cliente", "Configuracoes"],
    Component: SettingsPage,
  },
  {
    path: "/help",
    title: "Central de Ajuda",
    breadcrumbs: ["Cliente", "Ajuda"],
    Component: HelpCenterPage,
  },
];
