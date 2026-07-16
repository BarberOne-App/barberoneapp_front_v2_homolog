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

export async function getBarbershopPlatformSubscription(): Promise<{ subscription: PlatformSubscription | null }> {
  const { data } = await api.get('/pagarme/subscriptions/barbershop-platform-subscriptions/current');
  return data;
}

function onlyNumbers(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

export async function reactivateBarbershopPlatformPlan(data: {
  barbershopId: string;
  platformPlanId: string;
  amount: number;
  cardForm: CardForm;
  customer?: SubscriptionCustomer;
  subscriptionIntentToken?: string;
}) {
  if (!data.barbershopId) {
    throw new Error('Barbearia não identificada para reativação.');
  }

  if (!data.platformPlanId) {
    throw new Error('Plano não identificado para reativação.');
  }

  if (!data.subscriptionIntentToken) {
    throw new Error('Token de reativação não encontrado.');
  }

  const cardToken = await createPagarmeCardToken(data.cardForm);

  const response = await api.post(
    `/barbershops/${data.barbershopId}/reactivate-subscription`,
    {
      platformPlanId: data.platformPlanId,
      amount: data.amount,
      cardToken,
      subscriptionIntentToken: data.subscriptionIntentToken,
      customer: {
        name: data.customer?.name,
        email: data.customer?.email,
        document: onlyNumbers(data.cardForm.document),
        phone: onlyNumbers(data.cardForm.phone),
      },
    }
  );

  return response.data;
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
