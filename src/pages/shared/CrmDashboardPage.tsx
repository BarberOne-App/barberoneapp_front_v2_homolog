import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Loader2, MessageCircleWarning } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REASON_LABELS,
  getCrmDashboard,
  listCrmPipelines,
  type CrmDashboard,
  type CrmPipeline,
} from "@/service/crmService";

function getApiMessage(error: unknown) {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (Array.isArray(responseData)) return responseData.join(" ");
  if (responseData && typeof responseData === "object") {
    const message = (responseData as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return "Não foi possível concluir a operação.";
}

/* Paleta categorica validada (dataviz skill) contra a superficie escura do BarberOne (#141414). */
const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
const SEQUENTIAL_BLUE = "#3987e5";
const DIVERGING_BLUE = "#3987e5";
const DIVERGING_RED = "#e66767";
const GRID_COLOR = "#2c2c2a";
const AXIS_COLOR = "#898781";

const tooltipStyle = {
  backgroundColor: "#141414",
  border: "1px solid #2c2c2a",
  borderRadius: 8,
  fontSize: 12,
  color: "#fafafa",
};

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function CrmDashboardPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineId, setPipelineId] = useState<string>("");
  const [months, setMonths] = useState(6);
  const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelinesLoaded, setPipelinesLoaded] = useState(false);

  useEffect(() => {
    listCrmPipelines()
      .then((data) => {
        setPipelines(data);
        setPipelinesLoaded(true);
        // O funil mistura vocabulários de etapas entre pipelines diferentes,
        // então o dashboard sempre abre com um pipeline especifico selecionado
        // (nunca "todos") para que os rotulos das etapas facam sentido.
        setPipelineId((current) => {
          if (current && data.some((p) => p.id === current)) return current;
          return (data.find((p) => p.isDefault) ?? data[0])?.id ?? "";
        });
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!pipelinesLoaded) return;
    if (!pipelineId && pipelines.length > 0) return;
    setLoading(true);
    setError(null);
    getCrmDashboard({ pipelineId: pipelineId === "all" || !pipelineId ? undefined : pipelineId, months })
      .then(setDashboard)
      .catch((err) => setError(getApiMessage(err)))
      .finally(() => setLoading(false));
  }, [pipelineId, months, pipelinesLoaded, pipelines.length]);

  const funnelData = useMemo(
    () => (dashboard?.funnel ?? []).map((f) => ({ name: f.label, total: f.total })),
    [dashboard]
  );

  const reasonsData = useMemo(
    () =>
      (dashboard?.reasons ?? []).map((r, i) => ({
        name: REASON_LABELS[r.reason] ?? r.reason,
        total: r.total,
        percent: r.percent,
        color: CATEGORICAL[i % CATEGORICAL.length],
      })),
    [dashboard]
  );

  const monthlyData = useMemo(
    () =>
      (dashboard?.monthlyTrend ?? []).map((m) => ({
        month: monthLabel(m.month),
        Recuperados: m.recuperados,
        Encerrados: m.encerrados,
      })),
    [dashboard]
  );

  const responsibleCountData = useMemo(
    () =>
      (dashboard?.responsiblePerformance ?? []).map((r) => ({
        name: r.responsibleName,
        total: r.resolvedCount,
      })),
    [dashboard]
  );

  const responsibleDaysData = useMemo(
    () =>
      (dashboard?.responsiblePerformance ?? [])
        .filter((r) => r.avgResolutionDays !== null)
        .map((r) => ({ name: r.responsibleName, dias: r.avgResolutionDays ?? 0 })),
    [dashboard]
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Dashboard do CRM</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pipelineId} onValueChange={setPipelineId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pipelines</SelectItem>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : dashboard ? (
        <div className="flex flex-col gap-4">
          {/* Tiles de resumo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Clientes ativos no CRM</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{dashboard.summary.ativos}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Recuperados no período</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">{dashboard.summary.recuperados}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Encerrados no período</p>
              <p className="mt-1 text-2xl font-semibold text-muted-foreground">{dashboard.summary.encerrados}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Taxa de recuperação</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {dashboard.summary.recoveryRate !== null ? `${dashboard.summary.recoveryRate}%` : "–"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Funil por etapa */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Cards ativos por etapa</p>
              {funnelData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum card ativo neste pipeline.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(160, funnelData.length * 44)}>
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="total" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Motivos mais frequentes */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Motivos mais frequentes</p>
              {reasonsData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum card criado no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(160, reasonsData.length * 40)}>
                  <BarChart data={reasonsData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      formatter={(value: number, _n, item) => [`${value} (${item.payload.percent}%)`, "Cards"]}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {reasonsData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Evolucao mensal */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Evolução mensal (recuperados x encerrados)</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData} margin={{ left: 8, right: 24 }}>
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="month" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
                <Line type="monotone" dataKey="Recuperados" stroke={DIVERGING_BLUE} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Encerrados" stroke={DIVERGING_RED} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Atencao hoje */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Precisa de atenção hoje</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock size={16} className="text-[#fab219]" />
                  <span className="text-foreground">{dashboard.attentionItems.overdueNextAction}</span>
                  <span className="text-muted-foreground">retorno(s) vencido(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircleWarning size={16} className="text-[#ec835a]" />
                  <span className="text-foreground">{dashboard.attentionItems.noContactInDays}</span>
                  <span className="text-muted-foreground">sem contato há mais de 7 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-[#d03b3b]" />
                  <span className="text-foreground">{dashboard.attentionItems.lowRatingWithoutContact}</span>
                  <span className="text-muted-foreground">avaliação baixa sem tratativa</span>
                </div>
                {dashboard.attentionItems.overdueNextAction === 0 &&
                  dashboard.attentionItems.noContactInDays === 0 &&
                  dashboard.attentionItems.lowRatingWithoutContact === 0 && (
                    <p className="text-muted-foreground">Tudo em dia por aqui.</p>
                  )}
              </div>
            </div>

            {/* Desempenho por responsavel: casos resolvidos */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Casos resolvidos por responsável</p>
              {responsibleCountData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum card resolvido no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(140, responsibleCountData.length * 40)}>
                  <BarChart data={responsibleCountData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="total" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Desempenho por responsavel: tempo medio */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Tempo médio de resolução (dias)</p>
              {responsibleDaysData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sem dados suficientes.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(140, responsibleDaysData.length * 40)}>
                  <BarChart data={responsibleDaysData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="dias" fill="#d95926" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
