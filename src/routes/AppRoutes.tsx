import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppHeader } from "../components/shared/AppHeader";
import { getProfileConfig, normalizeRole } from "../config/profileConfig";
import type { UserRole } from "../config/profileConfig";
import { useAuth } from "../hooks/useAuth";
import { AdminLayout } from "../layouts/AdminLayout";
import { BarberLayout } from "../layouts/BarberLayout";
import { ClientLayout } from "../layouts/ClientLayout";
import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import { adminRoutes } from "./admin.routes";
import { barberRoutes } from "./barber.routes";
import { clientRoutes } from "./client.routes";
import { LogoutRoute } from "./LogoutRoute";
import { PrivateRoute } from "./PrivateRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { superAdminRoutes } from "./superadmin.routes";
import type { AppRoute } from "./types";

interface RouteGroup {
  Layout: ComponentType;
  routes: AppRoute[];
  headerActionLabel: string;
  headerActionHref: string;
}

const routeGroups: Record<UserRole, RouteGroup> = {
  client: {
    Layout: ClientLayout,
    routes: clientRoutes,
    headerActionLabel: "Marcar horario",
    headerActionHref: "/bookings",
  },
  barber: {
    Layout: BarberLayout,
    routes: barberRoutes,
    headerActionLabel: "Abrir agenda",
    headerActionHref: "/schedules",
  },
  admin: {
    Layout: AdminLayout,
    routes: adminRoutes,
    headerActionLabel: "Resumo",
    headerActionHref: "/overview",
  },
  super_admin: {
    Layout: SuperAdminLayout,
    routes: superAdminRoutes,
    headerActionLabel: "Metricas",
    headerActionHref: "/overview",
  },
};

function PageShell({
  route,
  actionLabel,
  actionHref,
}: {
  route: AppRoute;
  actionLabel: string;
  actionHref: string;
}) {
  const Page = route.Component;

  return (
    <>
      <AppHeader
        title={route.title}
        breadcrumbs={route.breadcrumbs}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
      <div className="p-6">
        <Page />
      </div>
    </>
  );
}

function toChildPath(path: string) {
  return path.replace(/^\//, "");
}

export function AppRoutes() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const profileConfig = getProfileConfig(role);
  const { Layout, routes, headerActionLabel, headerActionHref } = routeGroups[role];

  return (
    <PrivateRoute>
      <Routes>
        <Route path="/logout" element={<LogoutRoute />} />
        <Route
          element={
            <ProtectedRoute allowedRoles={[role]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to={profileConfig.defaultRoute} replace />} />

          {routes.map((route) => (
            <Route
              key={route.path}
              path={toChildPath(route.path)}
              element={
                <PageShell
                  route={route}
                  actionLabel={headerActionLabel}
                  actionHref={headerActionHref}
                />
              }
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to={profileConfig.defaultRoute} replace />} />
      </Routes>
    </PrivateRoute>
  );
}
