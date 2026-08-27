import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { PlatformPaymentRegistrationModal } from "@/components/PlatformPaymentRegistrationModal";
import {
  listManualPlatformSubscriptionPayments,
  listSuperAdminBarbershops,
  type ManualPlatformSubscriptionPayment,
  type SuperAdminBarbershop,
} from "@/service/superAdminService";

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

function fmtCurrency(value?: number | null) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Ativa",
    trialing: "Teste",
    past_due: "Pagamento pendente",
    paused: "Pagamento pendente",
    pending: "Pendente",
    expired: "Expirada",
    cancelled: "Cancelada",
    none: "Sem assinatura",
  };
  return labels[status] || status;
}

export function SuperAdminSubscriptionsPage() {
  const [barbershops, setBarbershops] = useState<SuperAdminBarbershop[]>([]);
  const [payments, setPayments] = useState<ManualPlatformSubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<SuperAdminBarbershop | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const all: SuperAdminBarbershop[] = [];
      let page = 1;
      while (true) {
        const result = await listSuperAdminBarbershops({ limit: 100, page, sortBy: "name", sortOrder: "asc" });
        const items = Array.isArray(result?.items) ? result.items : [];
        all.push(...items);
        if (all.length >= (result?.total ?? 0) || items.length < 100) break;
        page += 1;
      }
      const history = await listManualPlatformSubscriptionPayments({ limit: 20 });
      setBarbershops(all);
      setPayments(Array.isArray(history.items) ? history.items : []);
    } catch {
      toast.error("Não foi possível carregar as assinaturas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const rows = useMemo(() => barbershops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    shop,
    plan: shop.platformSubscription?.platform_plans?.name ?? shop.platformSubscription?.selected_plan ?? "Sem plano",
    status: shop.platformSubscription?.status ?? "none",
    paymentMethod: shop.platformSubscription?.payment_method ?? "-",
    nextBillingAt: shop.platformSubscription?.next_billing_date ?? null,
    price: shop.platformSubscription?.amount ?? shop.platformSubscription?.platform_plans?.price ?? null,
  })), [barbershops]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Gestão de Assinaturas</h3>
        <p className="text-sm text-muted-foreground">Consulte vencimentos e registre renovações pagas por PIX ou dinheiro.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"><th className="px-5 py-3">Barbearia</th><th className="px-5 py-3">Plano</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Pagamento</th><th className="px-5 py-3">Próxima cobrança</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Ações</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Carregando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma assinatura encontrada.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-5 py-3 text-foreground">{row.plan}</td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.status === "active" ? "bg-emerald-500/10 text-emerald-600" : row.status === "trialing" ? "bg-blue-500/10 text-blue-600" : ["past_due", "paused", "pending"].includes(row.status) ? "bg-amber-500/10 text-amber-700" : row.status === "none" ? "bg-secondary text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>{statusLabel(row.status)}</span></td>
                  <td className="px-5 py-3 text-muted-foreground">{row.paymentMethod === "pix" ? "PIX" : row.paymentMethod === "cash" ? "Dinheiro" : row.paymentMethod}</td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(row.nextBillingAt)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{fmtCurrency(row.price)}</td>
                  <td className="px-5 py-3"><button type="button" onClick={() => setPaymentTarget(row.shop)} className="rounded bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20">Registrar pagamento</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4"><ReceiptText size={18} className="text-primary" /><div><h3 className="font-semibold text-foreground">Histórico de pagamentos manuais</h3><p className="text-xs text-muted-foreground">Últimos registros confirmados pelo superadmin.</p></div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-3">Pagamento</th><th className="px-5 py-3">Barbearia</th><th className="px-5 py-3">Plano</th><th className="px-5 py-3">Método</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Novo vencimento</th><th className="px-5 py-3">Confirmado por</th><th className="px-5 py-3">Referência</th></tr></thead>
            <tbody>
              {!loading && payments.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum pagamento manual registrado.</td></tr> : payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(payment.paidAt)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{payment.barbershopName ?? "-"}</td>
                  <td className="px-5 py-3 text-foreground">{payment.planName ?? "-"}</td>
                  <td className="px-5 py-3">{payment.paymentMethod === "pix" ? "PIX" : "Dinheiro"}</td>
                  <td className="px-5 py-3 font-medium">{fmtCurrency(payment.amount)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(payment.nextBillingDate)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{payment.confirmedByName ?? "-"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{payment.receiptUrl ? <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink size={13} /> Comprovante</a> : payment.referenceCode || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {paymentTarget && (
        <PlatformPaymentRegistrationModal
          barbershopId={paymentTarget.id}
          barbershopName={paymentTarget.name}
          currentPlanId={paymentTarget.platformSubscription?.platform_plans?.id}
          currentDueDate={paymentTarget.platformSubscription?.next_billing_date}
          onClose={() => setPaymentTarget(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
