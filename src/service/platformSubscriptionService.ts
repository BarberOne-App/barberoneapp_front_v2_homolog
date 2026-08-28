import api from './api';
import { createPagarmeCardToken, type CardFormData } from './pagarmeService';

export interface PlatformPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number;
  features: string[];
  isRecommended: boolean;
  isPublic: boolean;
  active: boolean;
  color?: string | null;
}

type CardForm = {
  number: string;
  holderName: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  document: string;
  phone: string;
  installments: number;
};

type SubscriptionCustomer = {
  name?: string | null;
  email?: string | null;
};

export interface PlatformSubscription {
  id: string;
  status: string;
  selectedPlan: string;
  plan: PlatformPlan | null;
  amount: number | null;
  nextBillingDate: string | null;
  canceledAt: string | null;
  startDate: string | null;
  createdAt: string | null;
}

export interface PlatformSubscriptionAlert {
  kind: 'trial_ending' | 'subscription_due' | 'subscription_ending';
  severity: 'warning' | 'critical';
  daysRemaining: number;
  dueDate: string;
  message: string;
}

export interface SubscriptionRenewalContext {
  barbershopId: string;
  barbershopSlug?: string;
  barbershopName: string;
  expiredAt: string;
  subscriptionIntentToken: string;
  expiresAt: number;
}

const SUBSCRIPTION_RENEWAL_CONTEXT_KEY = 'barberone:subscription-renewal';

export function saveSubscriptionRenewalContext(
  context: Omit<SubscriptionRenewalContext, 'expiresAt'>,
) {
  const value: SubscriptionRenewalContext = {
    ...context,
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
  sessionStorage.setItem(SUBSCRIPTION_RENEWAL_CONTEXT_KEY, JSON.stringify(value));
}

export function loadSubscriptionRenewalContext(): SubscriptionRenewalContext | null {
  const stored = sessionStorage.getItem(SUBSCRIPTION_RENEWAL_CONTEXT_KEY);
  if (!stored) return null;

  try {
    const value = JSON.parse(stored) as Partial<SubscriptionRenewalContext>;
    const valid = Boolean(
      value.barbershopId &&
      value.barbershopName &&
      value.subscriptionIntentToken &&
      value.expiresAt &&
      value.expiresAt > Date.now(),
    );
    if (!valid) {
      sessionStorage.removeItem(SUBSCRIPTION_RENEWAL_CONTEXT_KEY);
      return null;
    }
    return value as SubscriptionRenewalContext;
  } catch {
    sessionStorage.removeItem(SUBSCRIPTION_RENEWAL_CONTEXT_KEY);
    return null;
  }
}

export function clearSubscriptionRenewalContext() {
  sessionStorage.removeItem(SUBSCRIPTION_RENEWAL_CONTEXT_KEY);
}

export async function getBarbershopPlatformSubscription(): Promise<{
  subscription: PlatformSubscription | null;
  alert: PlatformSubscriptionAlert | null;
}> {
  const { data } = await api.get('/pagarme/subscriptions/barbershop-platform-subscriptions/current');
  return data;
}

function onlyNumbers(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

export async function cancelBarbershopPlatformSubscription(): Promise<{ ok: boolean }> {
  const { data } = await api.post('/pagarme/subscriptions/barbershop-platform-subscriptions/cancel');
  return data;
}

export async function getPublicPlatformPlans(): Promise<{ items: PlatformPlan[] }> {
  const { data } = await api.get('/public/platform-plans');
  return data;
}

export interface SubscribePlatformPayload {
  platformPlanId: string;
  amount: number;
  cardForm: CardFormData;
  customer?: {
    name?: string;
    email?: string;
  };
}

export interface SubscribeClientPlanPayload {
  planId: string;
  amount: number;
  cardForm: CardFormData;
  customer?: {
    name?: string;
    email?: string;
  };
}

export async function subscribeClientToPlan(payload: SubscribeClientPlanPayload) {
  const cardToken = await createPagarmeCardToken(payload.cardForm);

  const { data } = await api.post('/pagarme/subscriptions/client-subscriptions', {
    planId: payload.planId,
    cardToken,
    customer: {
      name: payload.customer?.name ?? '',
      email: payload.customer?.email ?? '',
      document: payload.cardForm.document,
      phone: payload.cardForm.phone,
    },
  });

  return data;
}

export interface ClientPixOrderResult {
  orderId?: string;
  status?: string;
  chargeStatus?: string;
  pixQrCode?: string;
  pixQrCodeUrl?: string;
}

export async function createClientPlanPixOrder(payload: {
  planId: string;
  customer?: { document?: string; phone?: string };
}): Promise<ClientPixOrderResult> {
  const { data } = await api.post('/pagarme/subscriptions/client-subscriptions/pix', payload);
  return data;
}

export async function confirmClientPlanPixOrder(payload: {
  planId: string;
  orderId: string;
}): Promise<{ paid: boolean; status?: string; chargeStatus?: string }> {
  const { data } = await api.post('/pagarme/subscriptions/client-subscriptions/pix/confirm', payload);
  return data;
}

export async function subscribeBarbershopPlatformPlan(payload: SubscribePlatformPayload) {
  const cardToken = await createPagarmeCardToken(payload.cardForm);

  const { data } = await api.post('/pagarme/subscriptions/barbershop-platform-subscriptions', {
    platformPlanId: payload.platformPlanId,
    amount: payload.amount,
    cardToken,
    customer: {
      name: payload.customer?.name ?? '',
      email: payload.customer?.email ?? '',
      document: payload.cardForm.document,
      phone: payload.cardForm.phone,
    },
  });

  return data;
}

export async function reactivateBarbershopPlatformPlan(payload: {
  barbershopId: string;
  platformPlanId: string;
  amount: number;
  subscriptionIntentToken: string;
  cardForm: CardFormData;
  customer?: {
    name?: string | null;
    email?: string | null;
  };
}) {
  if (!payload.barbershopId) {
    throw new Error('Barbearia não identificada para reativação.');
  }

  if (!payload.platformPlanId) {
    throw new Error('Plano não identificado para reativação.');
  }

  if (!payload.subscriptionIntentToken) {
    throw new Error('Token de reativação não encontrado.');
  }

  const cardToken = await createPagarmeCardToken(payload.cardForm);

  const { data } = await api.post(
    `/barbershops/${payload.barbershopId}/reactivate-subscription`,
    {
      platformPlanId: payload.platformPlanId,
      amount: payload.amount,
      subscriptionIntentToken: payload.subscriptionIntentToken,
      cardToken,

      customer: {
        name:
          payload.customer?.name ??
          payload.cardForm.holderName ??
          'Cliente BarberOne',

        email: payload.customer?.email ?? '',

        document: onlyNumbers(payload.cardForm.document),
        phone: onlyNumbers(payload.cardForm.phone),
      },
    },
  );

  return data;
}
