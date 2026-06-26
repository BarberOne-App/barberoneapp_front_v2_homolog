import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { AdminSubscriptionsPage } from "../pages/admin/AdminSubscriptionsPage";
import { EmployeePayrollPage } from "../pages/admin/EmployeePayrollPage";
import { ExtraPaymentsPage } from "../pages/admin/ExtraPaymentsPage";
import { GalleryPage } from "../pages/admin/GalleryPage";
import { PlansPage } from "../pages/admin/PlansPage";
import { ProductsPage } from "../pages/admin/ProductsPage";
import { PromotionsPage } from "../pages/admin/PromotionsPage";
import { SubscriptionDefaultersPage } from "../pages/admin/SubscriptionDefaultersPage";
import { SubscriptionCommissionPoolPage } from "../pages/admin/SubscriptionCommissionPoolPage";
import { SubscriptionReceivablesCalendarPage } from "../pages/admin/SubscriptionReceivablesCalendarPage";
import { SubscriptionWithdrawalRequestPage } from "../pages/admin/SubscriptionWithdrawalRequestPage";
import { BookingsPage } from "../pages/shared/BookingsPage";
import { CashClosingPage } from "../pages/shared/CashClosingPage";
import { FitAppointmentPage } from "../pages/shared/FitAppointmentPage";
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
    path: "/encaixe",
    title: "Encaixe",
    breadcrumbs: ["Operacao", "Encaixe"],
    Component: FitAppointmentPage,
  },
  {
    path: "/payments",
    title: "Pagamentos",
    breadcrumbs: ["Financeiro", "Pagamentos"],
    Component: PaymentsPage,
  },
  {
    path: "/subscriptions",
    title: "Assinaturas",
    breadcrumbs: ["Financeiro", "Assinaturas"],
    Component: AdminSubscriptionsPage,
    requiredPermission: "manageBenefits",
  },
  {
    path: "/cash-closing",
    title: "Fechamento de caixa",
    breadcrumbs: ["Financeiro", "Fechamento de caixa"],
    Component: CashClosingPage,
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
    path: "/subscription-commissions",
    title: "Comissoes Plano",
    breadcrumbs: ["Administracao", "Comissoes Plano"],
    Component: SubscriptionCommissionPoolPage,
  },
  {
    path: "/subscription-receivables",
    title: "Calendario de Recebiveis",
    breadcrumbs: ["Assinaturas", "Calendario de Recebiveis"],
    Component: SubscriptionReceivablesCalendarPage,
    requiredPermission: "manageBenefits",
  },
  {
    path: "/subscription-defaulters",
    title: "Inadimplentes",
    breadcrumbs: ["Assinaturas", "Inadimplentes"],
    Component: SubscriptionDefaultersPage,
    requiredPermission: "manageBenefits",
  },
  {
    path: "/subscription-withdrawals",
    title: "Solicitar Saque",
    breadcrumbs: ["Assinaturas", "Solicitar Saque"],
    Component: SubscriptionWithdrawalRequestPage,
    requiredPermission: "manageBenefits",
  },
  {
    path: "/extra-payments",
    title: "Pagamentos Extras",
    breadcrumbs: ["Administracao", "Pagamentos Extras"],
    Component: ExtraPaymentsPage,
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
    path: "/plans",
    title: "Planos",
    breadcrumbs: ["Gerenciar", "Planos"],
    Component: PlansPage,
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
