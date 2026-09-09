import api from "./api";

export const CRM_REASONS = [
  "retorno_atrasado",
  "primeiro_atendimento_sem_retorno",
  "aniversario",
  "pos_atendimento",
  "avaliacao_baixa",
  "tratamento_em_continuidade",
  "oportunidade_manual",
] as const;

export type CrmReason = (typeof CRM_REASONS)[number];

export const REASON_LABELS: Record<string, string> = {
  retorno_atrasado: "Retorno atrasado",
  primeiro_atendimento_sem_retorno: "1º atendimento sem retorno",
  aniversario: "Aniversário",
  pos_atendimento: "Pós-atendimento",
  avaliacao_baixa: "Avaliação baixa",
  tratamento_em_continuidade: "Tratamento em continuidade",
  oportunidade_manual: "Oportunidade manual",
};

export function reasonLabel(reason: string | null | undefined) {
  if (!reason) return "";
  return REASON_LABELS[reason] ?? reason;
}

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  presencial: "Presencial",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  contact: "Contato registrado",
  stage_changed: "Mudança de etapa",
  note_added: "Observação adicionada",
  responsible_changed: "Responsável alterado",
  next_action_changed: "Próxima ação alterada",
  reopened: "Reaberto",
  resolved: "Resolvido",
};

export function stageLabel(stageKey: string | null | undefined, stages: CrmStageDefinition[] | undefined) {
  if (!stageKey) return "";
  return stages?.find((s) => s.key === stageKey)?.label ?? stageKey;
}

/* ── Types ── */
export type CrmTerminalOutcome = "recuperado" | "encerrado";

export interface CrmStageDefinition {
  key: string;
  label: string;
  sortOrder: number;
  isTerminal: boolean;
  terminalOutcome: CrmTerminalOutcome | null;
}

export interface CrmPipeline {
  id: string;
  barbershopId: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  stages: CrmStageDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmCardStats {
  lastVisitAt: string | null;
  daysSinceLastVisit: number | null;
  totalAppointments: number;
  cancellationRate: number | null;
  averageFrequencyDays: number | null;
  favoriteService: string | null;
  favoriteProfessional: string | null;
  averageTicket: number | null;
  lifetimeValue: number | null;
}

export interface CrmTrigger {
  id: string;
  reason: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface CrmCard {
  id: string;
  barbershopId: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  pipelineId: string;
  responsibleUserId: string | null;
  responsibleName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  stage: string;
  primaryReason: string | null;
  triggers: CrmTrigger[];
  lastContactType: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  notes: string | null;
  sortOrder: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: CrmCardStats;
}

export interface CrmEvent {
  id: string;
  barbershopId: string;
  cardId: string;
  eventType: string;
  fromStage: string | null;
  toStage: string | null;
  contactType: string | null;
  outcome: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CrmPostServiceAutomationConfig {
  enabled: boolean;
  genericPipelineId: string | null;
}

/* ── Cards ── */
export interface ListCrmCardsParams {
  pipelineId?: string;
  stage?: string;
  responsibleUserId?: string;
  q?: string;
}

export async function listCrmCards(params: ListCrmCardsParams = {}) {
  const response = await api.get<CrmCard[]>("/crm/cards", { params });
  return response.data;
}

export async function getCrmCard(cardId: string) {
  const response = await api.get<CrmCard>(`/crm/cards/${cardId}`);
  return response.data;
}

export interface CreateCrmCardPayload {
  clientId: string;
  pipelineId?: string;
  stage?: string;
  responsibleUserId?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  notes?: string | null;
  primaryReason: CrmReason;
}

export async function createCrmCard(data: CreateCrmCardPayload) {
  const response = await api.post<CrmCard>("/crm/cards", data);
  return response.data;
}

export interface UpdateCrmCardPayload {
  stage?: string;
  responsibleUserId?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  notes?: string | null;
  sortOrder?: number;
}

export async function updateCrmCard(cardId: string, data: UpdateCrmCardPayload) {
  const response = await api.patch<CrmCard>(`/crm/cards/${cardId}`, data);
  return response.data;
}

export async function deleteCrmCard(cardId: string) {
  await api.delete(`/crm/cards/${cardId}`);
}

/* ── Motivos (triggers) ── */
export async function addCrmTrigger(cardId: string, data: { reason: CrmReason; isPrimary?: boolean }) {
  const response = await api.post<CrmCard>(`/crm/cards/${cardId}/triggers`, data);
  return response.data;
}

export async function setCrmTriggerPrimary(cardId: string, triggerId: string) {
  const response = await api.patch<CrmCard>(`/crm/cards/${cardId}/triggers/${triggerId}`, {
    isPrimary: true,
  });
  return response.data;
}

/* ── Eventos / histórico ── */
export interface CreateCrmEventPayload {
  contactType?: string;
  outcome?: string | null;
  notes?: string | null;
}

export async function createCrmEvent(cardId: string, data: CreateCrmEventPayload) {
  const response = await api.post<CrmEvent>(`/crm/cards/${cardId}/events`, data);
  return response.data;
}

export async function listCrmEvents(cardId: string) {
  const response = await api.get<CrmEvent[]>(`/crm/cards/${cardId}/events`);
  return response.data;
}

/* ── Pipelines ── */
export async function listCrmPipelines() {
  const response = await api.get<CrmPipeline[]>("/crm/pipelines");
  return response.data;
}

export async function getCrmPipeline(pipelineId: string) {
  const response = await api.get<CrmPipeline>(`/crm/pipelines/${pipelineId}`);
  return response.data;
}

export interface SaveCrmPipelinePayload {
  name: string;
  isDefault?: boolean;
  sortOrder?: number;
  stages: CrmStageDefinition[];
}

export async function createCrmPipeline(data: SaveCrmPipelinePayload) {
  const response = await api.post<CrmPipeline>("/crm/pipelines", data);
  return response.data;
}

export async function updateCrmPipeline(pipelineId: string, data: Partial<SaveCrmPipelinePayload>) {
  const response = await api.patch<CrmPipeline>(`/crm/pipelines/${pipelineId}`, data);
  return response.data;
}

export async function deleteCrmPipeline(pipelineId: string) {
  await api.delete(`/crm/pipelines/${pipelineId}`);
}

/* ── Automação pós-atendimento ── */
export async function getCrmAutomation() {
  const response = await api.get<CrmPostServiceAutomationConfig>("/crm/automation/post-service");
  return response.data;
}

export async function saveCrmAutomation(data: CrmPostServiceAutomationConfig) {
  const response = await api.put<CrmPostServiceAutomationConfig>(
    "/crm/automation/post-service",
    data
  );
  return response.data;
}

/* ── Dashboard ── */
export interface CrmDashboardSummary {
  ativos: number;
  recuperados: number;
  encerrados: number;
  recoveryRate: number | null;
}

export interface CrmDashboardFunnelStage {
  stage: string;
  label: string;
  total: number;
}

export interface CrmDashboardReason {
  reason: string;
  total: number;
  percent: number;
}

export interface CrmDashboardMonth {
  month: string;
  recuperados: number;
  encerrados: number;
}

export interface CrmDashboardAttentionItems {
  overdueNextAction: number;
  noContactInDays: number;
  lowRatingWithoutContact: number;
}

export interface CrmDashboardResponsible {
  responsibleUserId: string | null;
  responsibleName: string;
  resolvedCount: number;
  avgResolutionDays: number | null;
}

export interface CrmDashboard {
  summary: CrmDashboardSummary;
  funnel: CrmDashboardFunnelStage[];
  reasons: CrmDashboardReason[];
  monthlyTrend: CrmDashboardMonth[];
  attentionItems: CrmDashboardAttentionItems;
  responsiblePerformance: CrmDashboardResponsible[];
}

export async function getCrmDashboard(params: { pipelineId?: string; months?: number } = {}) {
  const response = await api.get<CrmDashboard>("/crm/dashboard", { params });
  return response.data;
}
