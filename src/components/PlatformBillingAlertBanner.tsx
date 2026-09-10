import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { getBarbershopPlatformSubscription } from "@/service/platformSubscriptionService";
import { getSuperAdminPlatformSubscriptionAlerts } from "@/service/superAdminService";

type BillingBanner = {
  title: string;
  description: string;
  href: string;
  action: string;
  critical: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

export function PlatformBillingAlertBanner() {
  const { user, barbershopAccess } = useAuth();
  const [banner, setBanner] = useState<BillingBanner | null>(null);

  useEffect(() => {
    let active = true;
    const role = barbershopAccess
      ? "admin"
      : String(user?.role || "").toLowerCase();

    async function loadAdminAlert() {
      const result = await getBarbershopPlatformSubscription();
      if (!active) return;
      if (!result.alert) {
        setBanner(null);
        return;
      }
      const dueDate = formatDate(result.alert.dueDate);
      setBanner({
        title: result.alert.daysRemaining === 0
          ? "A assinatura vence hoje"
          : `A assinatura vence em ${result.alert.daysRemaining} dia(s)`,
        description: `${result.alert.message}${dueDate ? ` Data: ${dueDate}.` : ""}`,
        href: "/settings?tab=meuPlano",
        action: "Ver meu plano",
        critical: result.alert.severity === "critical",
      });
    }

    async function loadSuperAdminAlert() {
      const result = await getSuperAdminPlatformSubscriptionAlerts(7);
      if (!active) return;
      if (result.upcomingCount === 0 && result.overdueCount === 0) {
        setBanner(null);
        return;
      }
      const parts = [
        result.upcomingCount > 0
          ? `${result.upcomingCount} plano(s) vencem nos próximos 7 dias`
          : "",
        result.overdueCount > 0
          ? `${result.overdueCount} vencimento(s) em atraso nos últimos 30 dias`
          : "",
      ].filter(Boolean);
      setBanner({
        title: "Atenção às assinaturas das barbearias",
        description: `${parts.join(" e ")}. Consulte as datas e regularize os pagamentos.`,
        href: "/subscription-calendar",
        action: "Abrir calendário",
        critical: result.overdueCount > 0,
      });
    }

    const request = role === "admin"
      ? loadAdminAlert()
      : role === "super_admin"
        ? loadSuperAdminAlert()
        : Promise.resolve();
    void request.catch(() => {
      if (active) setBanner(null);
    });

    return () => {
      active = false;
    };
  }, [barbershopAccess, user?.role]);

  if (!banner) return null;

  return (
    <div className="px-4 pt-2 md:px-6">
      <div
        role="alert"
        className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
          banner.critical
            ? "border-destructive/40 bg-destructive/10"
            : "border-amber-500/40 bg-amber-500/10"
        }`}
      >
        <div className="flex min-w-0 items-start gap-3">
          {banner.critical ? (
            <AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={19} />
          ) : (
            <CalendarClock className="mt-0.5 shrink-0 text-amber-600" size={19} />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{banner.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{banner.description}</p>
          </div>
        </div>
        <Link
          to={banner.href}
          className="shrink-0 rounded-lg bg-background px-3 py-2 text-center text-xs font-semibold text-foreground shadow-sm ring-1 ring-border transition hover:bg-secondary"
        >
          {banner.action}
        </Link>
      </div>
    </div>
  );
}
