import { useAuth } from "./useAuth";

export type PermissionKey =
  | "viewAdmin"
  | "manageEmployees"
  | "manageCustomers"
  | "manageProducts"
  | "addProducts"
  | "editProducts"
  | "manageServices"
  | "addServices"
  | "editServices"
  | "managePayments"
  | "managePayroll"
  | "manageAgendamentos"
  | "manageOffScheduleAppointments"
  | "manageBlockedDates"
  | "manageBenefits"
  | "manageSettings"
  | "manageGallery";

export function usePermissions() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin === true || user?.role === "admin";

  function can(permission: PermissionKey): boolean {
    if (isAdmin) return true;
    return user?.permissions?.[permission] === true;
  }

  return { can, isAdmin };
}
