import { ClientBookingsPage } from "../pages/client/ClientBookingsPage";
import { ClientDashboard } from "../pages/client/ClientDashboard";
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
    Component: ClientBookingsPage,
  },
  {
    path: "/services",
    title: "Servicos",
    breadcrumbs: ["Cliente", "Servicos"],
    Component: ServicesPage,
  },
  {
    path: "/settings",
    title: "Configuracoes",
    breadcrumbs: ["Cliente", "Configuracoes"],
    Component: SettingsPage,
  },
];
