import { BarbershopsPage } from "../pages/super_admin/BarbershopsPage";
import { SuperAdminDashboard } from "../pages/super_admin/SuperAdminDashboard";
import { HelpCenterPage } from "../pages/shared/HelpCenterPage";
import { OverviewPage } from "../pages/shared/OverviewPage";
import { PaymentsPage } from "../pages/shared/PaymentsPage";
import { PermissionsPage } from "../pages/shared/PermissionsPage";
import { RolesPage } from "../pages/shared/RolesPage";
import { SettingsPage } from "../pages/shared/SettingsPage";
import { UsersPage } from "../pages/shared/UsersPage";
import type { AppRoute } from "./types";

export const superAdminRoutes: AppRoute[] = [
  {
    path: "/home",
    title: "Home",
    breadcrumbs: ["Super Admin", "Home"],
    Component: SuperAdminDashboard,
  },
  {
    path: "/overview",
    title: "Metricas gerais",
    breadcrumbs: ["Sistema", "Metricas gerais"],
    Component: OverviewPage,
  },
  {
    path: "/barbershops",
    title: "Barbearias",
    breadcrumbs: ["Sistema", "Barbearias"],
    Component: BarbershopsPage,
  },
  {
    path: "/users",
    title: "Usuarios",
    breadcrumbs: ["Sistema", "Usuarios"],
    Component: UsersPage,
  },
  {
    path: "/payments",
    title: "Pagamentos",
    breadcrumbs: ["Sistema", "Pagamentos"],
    Component: PaymentsPage,
  },
  {
    path: "/roles",
    title: "Perfis",
    breadcrumbs: ["Administracao", "Perfis"],
    Component: RolesPage,
  },
  {
    path: "/permissions",
    title: "Permissoes",
    breadcrumbs: ["Administracao", "Permissoes"],
    Component: PermissionsPage,
  },
  {
    path: "/settings",
    title: "Configuracoes",
    breadcrumbs: ["Administracao", "Configuracoes"],
    Component: SettingsPage,
  },
  {
    path: "/help",
    title: "Central de Ajuda",
    breadcrumbs: ["Super Admin", "Ajuda"],
    Component: HelpCenterPage,
  },
];
