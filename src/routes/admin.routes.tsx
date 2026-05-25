import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { EmployeePayrollPage } from "../pages/admin/EmployeePayrollPage";
import { GalleryPage } from "../pages/admin/GalleryPage";
import { ProductsPage } from "../pages/admin/ProductsPage";
import { PromotionsPage } from "../pages/admin/PromotionsPage";
import { BookingsPage } from "../pages/shared/BookingsPage";
import { CustomersPage } from "../pages/shared/CustomersPage";
import { HelpCenterPage } from "../pages/shared/HelpCenterPage";
import { OverviewPage } from "../pages/shared/OverviewPage";
import { PaymentsPage } from "../pages/shared/PaymentsPage";
import { ReviewsPage } from "../pages/shared/ReviewsPage";
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
    path: "/users",
    title: "Funcionarios",
    breadcrumbs: ["Administracao", "Funcionarios"],
    Component: UsersPage,
  },
  {
    path: "/employee-payroll",
    title: "Pagamento Funcionário",
    breadcrumbs: ["Administracao", "Pagamento Funcionário"],
    Component: EmployeePayrollPage,
  },
  {
    path: "/customers",
    title: "Clientes",
    breadcrumbs: ["Administracao", "Clientes"],
    Component: CustomersPage,
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
    path: "/gallery",
    title: "Galeria",
    breadcrumbs: ["Gerenciar", "Galeria"],
    Component: GalleryPage,
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
