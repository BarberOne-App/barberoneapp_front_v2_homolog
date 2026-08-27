import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import barberOneLogo from '@/assets/image/barberOne-logo.png';
import { SubscriptionPaymentModal } from '@/components/SubscriptionPaymentModal';
import {
  clearSubscriptionRenewalContext,
  getPublicPlatformPlans,
  loadSubscriptionRenewalContext,
  type PlatformPlan,
  type SubscriptionRenewalContext,
} from '@/service/platformSubscriptionService';

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatPeriod(plan: PlatformPlan) {
  const count = Math.max(1, Number(plan.intervalCount || 1));
  const interval = String(plan.interval || 'month').toLowerCase();
  if (interval.startsWith('day')) return count === 1 ? '/dia' : `/${count} dias`;
  if (interval.startsWith('week')) return count === 1 ? '/semana' : `/${count} semanas`;
  if (interval.startsWith('year')) return count === 1 ? '/ano' : `/${count} anos`;
  return count === 1 ? '/mês' : `/${count} meses`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}

export function RenewSubscriptionPage() {
  const navigate = useNavigate();
  const [context, setContext] = useState<SubscriptionRenewalContext | null>(() => (
    loadSubscriptionRenewalContext()
  ));
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlatformPlan | null>(null);
  const [loading, setLoading] = useState(Boolean(context));
  const [loadError, setLoadError] = useState('');
  const [authorizationExpired, setAuthorizationExpired] = useState(false);

  useEffect(() => {
    if (!context) return;
    getPublicPlatformPlans()
      .then((response) => {
        const available = (Array.isArray(response.items) ? response.items : [])
          .filter((plan) => plan.active !== false && plan.isPublic !== false);
        setPlans(available);
        setLoadError(available.length === 0 ? 'Nenhum plano está disponível no momento.' : '');
      })
      .catch(() => setLoadError('Não foi possível carregar os planos. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [context]);

  function returnToLogin() {
    clearSubscriptionRenewalContext();
    navigate('/login', { replace: true });
  }

  function handleAuthorizationExpired() {
    clearSubscriptionRenewalContext();
    setSelectedPlan(null);
    setContext(null);
    setAuthorizationExpired(true);
  }

  function handleSuccess() {
    clearSubscriptionRenewalContext();
    navigate('/login', { replace: true });
  }

  if (!context) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">
            {authorizationExpired ? 'Autorização expirada' : 'Renovação não iniciada'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre novamente com a conta administradora da barbearia para gerar uma nova autorização de renovação.
          </p>
          <button type="button" onClick={() => navigate('/login', { replace: true })} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
            Voltar para o login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <img src={barberOneLogo} alt="BarberOne" className="h-16 w-auto object-contain" />
          <button type="button" onClick={returnToLogin} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ArrowLeft size={16} /> Voltar ao login
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Renovação de assinatura</p>
              <h1 className="mt-1 text-2xl font-bold">{context.barbershopName}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                A assinatura venceu em {formatDate(context.expiredAt)}. Escolha um plano para reativar o acesso sem criar um novo cadastro.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <ShieldCheck size={18} className="text-emerald-500" />
              Pagamento seguro via Pagar.me
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Escolha o plano para renovar</h2>
            <p className="mt-2 text-sm text-muted-foreground">A cobrança será recorrente no cartão de crédito.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="animate-spin" size={20} /> Carregando planos...
            </div>
          ) : loadError ? (
            <div className="mx-auto mt-8 max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center text-sm text-destructive">
              {loadError}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${plan.isRecommended ? 'border-primary shadow-primary/10' : 'border-border'}`}>
                  {plan.isRecommended && <span className="mb-4 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Recomendado</span>}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {plan.description && <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>}
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="pb-1 text-sm text-muted-foreground">{formatPeriod(plan)}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setSelectedPlan(plan)} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
                    <CreditCard size={17} /> Escolher {plan.name}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <SubscriptionPaymentModal
        isOpen={Boolean(selectedPlan)}
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onSuccess={handleSuccess}
        onAuthorizationExpired={handleAuthorizationExpired}
        reactivation={{
          barbershopId: context.barbershopId,
          barbershopName: context.barbershopName,
          subscriptionIntentToken: context.subscriptionIntentToken,
        }}
      />
    </main>
  );
}
