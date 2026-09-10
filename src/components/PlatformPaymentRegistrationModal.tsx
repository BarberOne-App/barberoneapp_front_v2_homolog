import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getPlatformPlans,
  registerManualPlatformSubscriptionPayment,
  type ManualPlatformSubscriptionPayment,
  type ManualPlatformPaymentMethod,
  type PlatformPlan,
} from "@/service/superAdminService";

type Props = {
  barbershopId: string;
  barbershopName: string;
  currentPlanId?: string | null;
  currentDueDate?: string | null;
  onClose: () => void;
  onSuccess: (payment: ManualPlatformSubscriptionPayment) => void | Promise<void>;
};

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addPlanInterval(base: Date, plan?: PlatformPlan) {
  const next = new Date(base);
  const count = Math.max(1, Number(plan?.intervalCount ?? plan?.interval_count ?? 1));
  const interval = String(plan?.interval || "month").toLowerCase();
  if (interval.startsWith("day")) next.setDate(next.getDate() + count);
  else if (interval.startsWith("week")) next.setDate(next.getDate() + count * 7);
  else if (interval.startsWith("year")) next.setFullYear(next.getFullYear() + count);
  else next.setMonth(next.getMonth() + count);
  return next;
}

export function PlatformPaymentRegistrationModal({
  barbershopId,
  barbershopName,
  currentPlanId,
  currentDueDate,
  onClose,
  onSuccess,
}: Props) {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    platformPlanId: currentPlanId || "",
    paymentMethod: "pix" as ManualPlatformPaymentMethod,
    paidAt: toInputDate(new Date().toISOString()),
    amount: "",
    nextBillingDate: "",
    referenceCode: "",
    notes: "",
    receiptUrl: "",
    idempotencyKey: crypto.randomUUID(),
  });

  useEffect(() => {
    let active = true;
    getPlatformPlans()
      .then((result) => {
        if (!active) return;
        const available = result.filter((plan) => plan.active !== false);
        setPlans(available);
        setForm((previous) => {
          const planId = previous.platformPlanId || available[0]?.id || "";
          const selected = available.find((plan) => plan.id === planId);
          return {
            ...previous,
            platformPlanId: planId,
            amount: previous.amount || (selected ? String(Number(selected.price)) : ""),
          };
        });
      })
      .catch(() => toast.error("Não foi possível carregar os planos."))
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedPlan = plans.find((plan) => plan.id === form.platformPlanId);
  const suggestedNextBillingDate = useMemo(() => {
    const paidAt = new Date(`${form.paidAt}T12:00:00`);
    if (Number.isNaN(paidAt.getTime()) || !selectedPlan) return "";
    const currentDue = currentDueDate ? new Date(currentDueDate) : null;
    const base = currentDue && !Number.isNaN(currentDue.getTime()) && currentDue > paidAt
      ? currentDue
      : paidAt;
    return toInputDate(addPlanInterval(base, selectedPlan).toISOString());
  }, [currentDueDate, form.paidAt, selectedPlan]);

  function selectPlan(platformPlanId: string) {
    const plan = plans.find((item) => item.id === platformPlanId);
    setForm((previous) => ({
      ...previous,
      platformPlanId,
      amount: plan ? String(Number(plan.price)) : previous.amount,
    }));
  }

  async function submit() {
    const amount = Number(form.amount.replace(",", "."));
    if (!form.platformPlanId || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Selecione o plano e informe um valor válido.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerManualPlatformSubscriptionPayment(barbershopId, {
        platformPlanId: form.platformPlanId,
        paymentMethod: form.paymentMethod,
        amount,
        paidAt: form.paidAt || undefined,
        nextBillingDate: form.nextBillingDate || undefined,
        referenceCode: form.referenceCode.trim() || undefined,
        notes: form.notes.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
        idempotencyKey: form.idempotencyKey,
      });
      toast.success(result.duplicated ? "Pagamento já estava registrado." : "Pagamento registrado e plano renovado.");
      await onSuccess(result.payment);
      onClose();
    } catch {
      toast.error("Não foi possível registrar o pagamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Registrar pagamento</h3>
            <p className="text-sm text-muted-foreground">{barbershopName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-secondary">Fechar</button>
        </div>

        {loadingPlans ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={18} /> Carregando planos...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["pix", "cash"] as ManualPlatformPaymentMethod[]).map((method) => (
                <button key={method} type="button" onClick={() => setForm((previous) => ({ ...previous, paymentMethod: method }))} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium ${form.paymentMethod === method ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                  {method === "pix" ? <CreditCard size={16} /> : <Banknote size={16} />}
                  {method === "pix" ? "PIX" : "Dinheiro"}
                </button>
              ))}
            </div>

            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Plano</span><select value={form.platformPlanId} onChange={(event) => selectPlan(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground">{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</option>)}</select></label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Data do pagamento</span><input type="date" value={form.paidAt} onChange={(event) => setForm((previous) => ({ ...previous, paidAt: event.target.value }))} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Valor pago</span><input inputMode="decimal" value={form.amount} onChange={(event) => setForm((previous) => ({ ...previous, amount: event.target.value }))} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground" /></label>
            </div>

            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Próximo vencimento</span><input type="date" value={form.nextBillingDate} onChange={(event) => setForm((previous) => ({ ...previous, nextBillingDate: event.target.value }))} placeholder={suggestedNextBillingDate} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground" /><span className="block text-xs text-muted-foreground">Cálculo automático: {suggestedNextBillingDate ? suggestedNextBillingDate.split("-").reverse().join("/") : "-"}. Preencha somente para ajustar.</span></label>

            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Referência ou identificação do pagamento</span><input value={form.referenceCode} onChange={(event) => setForm((previous) => ({ ...previous, referenceCode: event.target.value }))} placeholder={form.paymentMethod === "pix" ? "ID da transação PIX" : "Ex.: recebido no caixa"} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Link do comprovante (opcional)</span><input type="url" value={form.receiptUrl} onChange={(event) => setForm((previous) => ({ ...previous, receiptUrl: event.target.value }))} placeholder="https://..." className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Observação</span><textarea value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" /></label>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">Cancelar</button>
          <button type="button" onClick={() => void submit()} disabled={submitting || loadingPlans || plans.length === 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{submitting ? "Registrando..." : "Confirmar e renovar"}</button>
        </div>
      </div>
    </div>
  );
}
