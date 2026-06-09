import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { listSuperAdminBarbershops, type SuperAdminBarbershop } from "@/service/superAdminService";

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function fmtCurrency(value?: number | null) {
  if (value == null) return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function SuperAdminSubscriptionsPage() {
  const [barbershops, setBarbershops] = useState<SuperAdminBarbershop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const all: SuperAdminBarbershop[] = [];
        let page = 1;
        while (true) {
          const result = await listSuperAdminBarbershops({ limit: 100, page, sortBy: "name", sortOrder: "asc" });
          const items = Array.isArray(result?.items) ? result.items : [];
          all.push(...items);
          if (all.length >= (result?.total ?? 0) || items.length < 100) break;
          page++;
        }
        setBarbershops(all);
      } catch { toast.error("Nao foi possivel carregar as assinaturas."); } finally { setLoading(false); }
    })();
  }, []);

  const rows = useMemo(() =>
    barbershops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      plan: shop.subscription?.subscription_plans?.name ?? "Sem plano",
      status: shop.subscription?.status ?? "none",
      nextBillingAt: shop.subscription?.next_billing_at ?? null,
      price: shop.subscription?.subscription_plans?.price ?? null,
    })),
    [barbershops]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Gestao de Assinaturas</h3>
        <p className="text-sm text-muted-foreground">Visualize o resumo de planos e situacao atual das assinaturas.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Barbearia</th>
                <th className="px-5 py-3">Plano</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Proxima cobranca</th>
                <th className="px-5 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 animate-spin" size={20} />Carregando...
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-5 py-3 text-foreground">{row.plan}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.status === "active" ? "bg-emerald-500/10 text-emerald-600"
                      : row.status === "trialing" ? "bg-blue-500/10 text-blue-600"
                      : row.status === "past_due" ? "bg-amber-500/10 text-amber-600"
                      : row.status === "none" ? "bg-secondary text-muted-foreground"
                      : "bg-destructive/10 text-destructive"
                    }`}>
                      {row.status === "active" ? "Ativa"
                        : row.status === "trialing" ? "Teste"
                        : row.status === "past_due" ? "Pagamento pendente"
                        : row.status === "none" ? "Sem assinatura"
                        : row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(row.nextBillingAt)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{fmtCurrency(row.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
