import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { ProductsPage } from "../pages/admin/ProductsPage";
import { PromotionsPage } from "../pages/admin/PromotionsPage";
import { StaffPage } from "../pages/admin/StaffPage";
import { BookingsPage } from "../pages/shared/BookingsPage";
import { CustomersPage } from "../pages/shared/CustomersPage";
import { HelpCenterPage } from "../pages/shared/HelpCenterPage";
import { OverviewPage } from "../pages/shared/OverviewPage";
import { PaymentsPage } from "../pages/shared/PaymentsPage";
import { PermissionsPage } from "../pages/shared/PermissionsPage";
import { ReviewsPage } from "../pages/shared/ReviewsPage";
import { RolesPage } from "../pages/shared/RolesPage";
import { SchedulesPage } from "../pages/shared/SchedulesPage";
import { ServicesPage } from "../pages/shared/ServicesPage";
import { UsersPage } from "../pages/shared/UsersPage";
import type { AppRoute } from "./types";

export const adminRoutes: AppRoute[] = [
  {
    path: "/home",
    title: "Home",
    breadcrumbs: ["Administracao", "Home"],
    Component: AdminDashboard,
  },
  {
    path: "/overview",
    title: "Dashboard",
    breadcrumbs: ["Administracao", "Dashboard"],
    Component: OverviewPage,
  },
  {
    path: "/customers",
    title: "Clientes",
    breadcrumbs: ["Operacao", "Clientes"],
    Component: CustomersPage,
  },
  {
    path: "/bookings",
    title: "Agendamentos",
    breadcrumbs: ["Operacao", "Agendamentos"],
    Component: BookingsPage,
  },
  {
    path: "/payments",
    title: "Pagamentos",
    breadcrumbs: ["Financeiro", "Pagamentos"],
    Component: PaymentsPage,
  },
  {
    path: "/staff",
    title: "Funcionarios",
    breadcrumbs: ["Gerenciar", "Funcionarios"],
    Component: StaffPage,
  },
  {
    path: "/services",
    title: "Servicos",
    breadcrumbs: ["Gerenciar", "Servicos"],
    Component: ServicesPage,
  },
  {
    path: "/products",
    title: "Produtos",
    breadcrumbs: ["Gerenciar", "Produtos"],
    Component: ProductsPage,
  },
  {
    path: "/schedules",
    title: "Calendario",
    breadcrumbs: ["Operacao", "Calendario"],
    Component: SchedulesPage,
  },
  {
    path: "/promotions",
    title: "Promocoes",
    breadcrumbs: ["Marketing", "Promocoes"],
    Component: PromotionsPage,
  },
  {
    path: "/reviews",
    title: "Avaliacoes",
    breadcrumbs: ["Relacionamento", "Avaliacoes"],
    Component: ReviewsPage,
  },
  {
    path: "/users",
    title: "Usuarios",
    breadcrumbs: ["Administracao", "Usuarios"],
    Component: UsersPage,
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
    Component: AdminSettingsPage,
  },
  {
    path: "/help",
    title: "Central de Ajuda",
    breadcrumbs: ["Administracao", "Ajuda"],
    Component: HelpCenterPage,
  },
];
