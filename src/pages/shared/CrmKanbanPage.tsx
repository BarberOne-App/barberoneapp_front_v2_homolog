import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import {
  Clock,
  Filter,
  HelpCircle,
  Kanban as KanbanIcon,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Star,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrmAutomationDialog } from "@/components/CrmAutomationDialog";
import { CrmCardDetailDialog } from "@/components/CrmCardDetailDialog";
import { CrmCreateCardDialog } from "@/components/CrmCreateCardDialog";
import { CrmPipelineManagerDialog } from "@/components/CrmPipelineManagerDialog";
import {
  CONTACT_TYPE_LABELS,
  REASON_LABELS,
  listCrmCards,
  listCrmPipelines,
  reasonLabel,
  updateCrmCard,
  type CrmCard,
  type CrmPipeline,
} from "@/service/crmService";
import { listUsers, type UserProfile } from "@/service/userService";
import { useCrmTour } from "@/hooks/useCrmTour";

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STAGE_BAR_COLORS = [
  "bg-primary",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
];

type SortBy = "default" | "days" | "ticket";

interface DragState {
  cardId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
  ghost: HTMLElement | null;
  sourceEl: HTMLElement;
}

export function CrmKanbanPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(true);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

  const [cards, setCards] = useState<CrmCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [staff, setStaff] = useState<UserProfile[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const dragStateRef = useRef<DragState | null>(null);
  const { registerControls, unregisterControls, startTour, hasSeenTour } = useCrmTour();
  const lastCreatedCardIdRef = useRef<string | null>(null);
  const hasAutoStartedRef = useRef(false);
  const cardsRef = useRef<CrmCard[]>([]);

  const activePipeline = useMemo(
    () => pipelines.find((p) => p.id === activePipelineId) ?? null,
    [pipelines, activePipelineId]
  );

  const loadPipelines = useCallback(() => {
    setPipelinesLoading(true);
    listCrmPipelines()
      .then((data) => {
        setPipelines(data);
        setActivePipelineId((current) => {
          if (current && data.some((p) => p.id === current)) return current;
          const preferred = data.find((p) => p.isDefault) ?? data[0];
          return preferred?.id ?? null;
        });
      })
      .catch((err) => toast.error(getApiMessage(err)))
      .finally(() => setPipelinesLoading(false));
  }, []);

  useEffect(() => {
    loadPipelines();
    listUsers({ excludeRole: "client", limit: 100 })
      .then((r) => setStaff(r.items))
      .catch(() => null);
  }, [loadPipelines]);

  const load = useCallback(
    (pipelineId: string, silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      return listCrmCards({ pipelineId })
        .then(setCards)
        .catch((err) => {
          if (!silent) setError(getApiMessage(err));
        })
        .finally(() => {
          if (!silent) setLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    if (!activePipelineId) return;
    void load(activePipelineId);
    const timer = window.setInterval(() => void load(activePipelineId, true), 10000);
    return () => window.clearInterval(timer);
  }, [activePipelineId, load]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    registerControls({
      openCreateDialog: () => setCreateOpen(true),
      closeCreateDialog: () => setCreateOpen(false),
      openManagerDialog: () => setManagerOpen(true),
      closeManagerDialog: () => setManagerOpen(false),
      openAutomationDialog: () => setAutomationOpen(true),
      closeAutomationDialog: () => setAutomationOpen(false),
      openCardDetail: (cardId) =>
        setSelectedCardId(cardId ?? lastCreatedCardIdRef.current ?? cardsRef.current[0]?.id ?? null),
      closeCardDetail: () => setSelectedCardId(null),
    });
    if (!hasAutoStartedRef.current && !hasSeenTour) {
      hasAutoStartedRef.current = true;
      startTour();
    }
    return () => unregisterControls();
  }, [registerControls, unregisterControls, startTour, hasSeenTour]);

  const responsibleOptions = useMemo(() => {
    const map = new Map<string, string>();
    staff.forEach((s) => map.set(s.id, s.name));
    return Array.from(map.entries());
  }, [staff]);

  const reasonOptions = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.triggers.forEach((t) => set.add(t.reason)));
    return Array.from(set);
  }, [cards]);

  const summary = useMemo(() => {
    const stageOutcome = new Map(
      (activePipeline?.stages ?? []).map((s) => [s.key, s.terminalOutcome])
    );
    let ativos = 0;
    let recuperados = 0;
    let encerrados = 0;
    for (const card of cards) {
      if (!card.resolvedAt) {
        ativos += 1;
        continue;
      }
      const outcome = stageOutcome.get(card.stage);
      if (outcome === "recuperado") recuperados += 1;
      else if (outcome === "encerrado") encerrados += 1;
    }
    const totalResolved = recuperados + encerrados;
    const taxa = totalResolved > 0 ? Math.round((recuperados / totalResolved) * 100) : null;
    return { ativos, recuperados, encerrados, taxa };
  }, [cards, activePipeline]);

  const visibleCards = useMemo(() => {
    let list = cards;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.clientName.toLowerCase().includes(term) ||
          (c.clientPhone ?? "").toLowerCase().includes(term) ||
          reasonLabel(c.primaryReason).toLowerCase().includes(term) ||
          (c.responsibleName ?? "").toLowerCase().includes(term)
      );
    }
    if (responsibleFilter !== "all") {
      list = list.filter((c) => c.responsibleUserId === responsibleFilter);
    }
    if (reasonFilter !== "all") {
      list = list.filter((c) => c.triggers.some((t) => t.reason === reasonFilter));
    }
    if (sortBy === "days") {
      list = [...list].sort(
        (a, b) => (b.stats.daysSinceLastVisit ?? -1) - (a.stats.daysSinceLastVisit ?? -1)
      );
    } else if (sortBy === "ticket") {
      list = [...list].sort((a, b) => (b.stats.averageTicket ?? 0) - (a.stats.averageTicket ?? 0));
    }
    return list;
  }, [cards, search, responsibleFilter, reasonFilter, sortBy]);

  const columns = useMemo(() => {
    const stages = [...(activePipeline?.stages ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    return stages.map((stage) => ({
      key: stage.key,
      label: stage.label,
      isTerminal: stage.isTerminal,
      cards: visibleCards
        .filter((c) => c.stage === stage.key)
        .sort((a, b) => (sortBy === "default" ? a.sortOrder - b.sortOrder : 0)),
    }));
  }, [activePipeline, visibleCards, sortBy]);

  const totalVisibleCards = visibleCards.length;

  async function moveCardToStage(card: CrmCard, newStage: string) {
    const previous = cards;
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, stage: newStage } : c)));
    try {
      await updateCrmCard(card.id, { stage: newStage });
    } catch (err) {
      setCards(previous);
      toast.error(getApiMessage(err));
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>, card: CrmCard) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      cardId: card.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null,
      sourceEl: target,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    if (!state.moved && Math.hypot(dx, dy) > 6) {
      state.moved = true;
      const rect = state.sourceEl.getBoundingClientRect();
      const ghost = state.sourceEl.cloneNode(true) as HTMLElement;
      ghost.style.position = "fixed";
      ghost.style.pointerEvents = "none";
      ghost.style.width = `${rect.width}px`;
      ghost.style.opacity = "0.85";
      ghost.style.zIndex = "9999";
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      document.body.appendChild(ghost);
      state.ghost = ghost;
      state.sourceEl.style.opacity = "0.3";
    }

    if (state.moved && state.ghost) {
      state.ghost.style.left = `${event.clientX - state.offsetX}px`;
      state.ghost.style.top = `${event.clientY - state.offsetY}px`;

      document
        .querySelectorAll("[data-crm-column]")
        .forEach((el) => el.classList.remove("ring-2", "ring-primary"));
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const columnEl = hovered?.closest("[data-crm-column]");
      columnEl?.classList.add("ring-2", "ring-primary");
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    dragStateRef.current = null;
    if (!state) return;

    state.ghost?.remove();
    state.sourceEl.style.opacity = "";
    document
      .querySelectorAll("[data-crm-column]")
      .forEach((el) => el.classList.remove("ring-2", "ring-primary"));

    if (!state.moved) return;

    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const columnKey = hovered?.closest<HTMLElement>("[data-crm-column]")?.dataset.crmColumn;
    if (!columnKey) return;

    const card = cards.find((c) => c.id === state.cardId);
    if (!card || card.stage === columnKey) return;

    void moveCardToStage(card, columnKey);
  }

  const showEmptyPipelines = !pipelinesLoading && pipelines.length === 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KanbanIcon size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">CRM</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, telefone, motivo ou responsável..."
              className="h-9 w-full bg-secondary pl-9 text-sm sm:w-72"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter size={14} />
                Responsável
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                {responsibleOptions.map(([id, name]) => (
                  <DropdownMenuRadioItem key={id} value={id}>
                    {name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter size={14} />
                Motivo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={reasonFilter} onValueChange={setReasonFilter}>
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                {reasonOptions.map((reason) => (
                  <DropdownMenuRadioItem key={reason} value={reason}>
                    {REASON_LABELS[reason] ?? reason}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <DropdownMenuRadioItem value="default">Padrão</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="days">Mais dias sem retornar</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ticket">Maior ticket médio</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            title="Automação pós-atendimento"
            data-tour="kanban-automacao-btn"
            onClick={() => setAutomationOpen(true)}
          >
            <Zap size={14} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            title="Pipelines"
            data-tour="kanban-pipelines-btn"
            onClick={() => setManagerOpen(true)}
          >
            <Settings size={14} />
          </Button>

          <Button variant="outline" size="icon" title="Tour guiado" onClick={() => startTour()}>
            <HelpCircle size={14} />
          </Button>

          <Button
            size="sm"
            data-tour="kanban-novo-card-btn"
            onClick={() => setCreateOpen(true)}
            disabled={!activePipelineId}
          >
            <Plus size={14} className="mr-2" />
            Novo card
          </Button>
        </div>
      </div>

      {pipelines.length > 1 && (
        <Tabs value={activePipelineId ?? undefined} onValueChange={setActivePipelineId}>
          <TabsList>
            {pipelines.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>
                {p.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {!pipelinesLoading && !showEmptyPipelines && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Cards ativos</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{summary.ativos}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Recuperados</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-500">{summary.recuperados}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Encerrados</p>
            <p className="mt-1 text-2xl font-semibold text-muted-foreground">{summary.encerrados}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Taxa de recuperação</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {summary.taxa !== null ? `${summary.taxa}%` : "–"}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4" data-tour="kanban-board">
      {pipelinesLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : showEmptyPipelines ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
          <p>Nenhum pipeline criado ainda.</p>
          <Button size="sm" onClick={() => setManagerOpen(true)}>
            Criar pipeline
          </Button>
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : visibleCards.length === 0 && cards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Nenhum card neste pipeline ainda. Crie o primeiro card ou espere a automação pós-atendimento.
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Nenhum card encontrado com os filtros atuais.
        </div>
      ) : (
        <>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
            {columns.map((column, columnIndex) => (
              <div
                key={column.key}
                data-crm-column={column.key}
                className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/30 p-2 transition-all"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-foreground">{column.label}</span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    {column.cards.length}
                  </span>
                </div>

                <div
                  className="flex flex-1 flex-col gap-2 overflow-y-auto"
                  {...(columnIndex === 0 ? { "data-tour": "kanban-column-cards" } : {})}
                >
                  {column.cards.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Nenhum card aqui
                    </div>
                  ) : (
                    column.cards.map((card) => (
                      <div
                        key={card.id}
                        id={`crm-card-${card.id}`}
                        onPointerDown={(e) => handlePointerDown(e, card)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onClick={() => {
                          if (!dragStateRef.current?.moved) setSelectedCardId(card.id);
                        }}
                        className="cursor-grab select-none rounded-md border border-border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                              {getInitials(card.clientName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{card.clientName}</p>
                            {card.clientPhone && (
                              <p className="truncate text-xs text-muted-foreground">{card.clientPhone}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {card.primaryReason && (
                            <Badge variant="default" className="gap-1 text-[10px]">
                              <Star size={9} />
                              {reasonLabel(card.primaryReason)}
                            </Badge>
                          )}
                          {card.triggers
                            .filter((t) => !t.isPrimary)
                            .slice(0, 2)
                            .map((t) => (
                              <Badge key={t.id} variant="outline" className="text-[10px]">
                                {reasonLabel(t.reason)}
                              </Badge>
                            ))}
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                          {card.stats.favoriteService && <p>Serviço favorito: {card.stats.favoriteService}</p>}
                          <p className="flex items-center gap-1">
                            <Clock size={10} />
                            {card.stats.lastVisitAt
                              ? `Última visita: há ${card.stats.daysSinceLastVisit} dia(s)`
                              : "Última visita: Sem visitas"}
                          </p>
                          {card.lastContactType && (
                            <p className="flex items-center gap-1">
                              <MessageCircle size={10} />
                              {CONTACT_TYPE_LABELS[card.lastContactType] ?? card.lastContactType}
                            </p>
                          )}
                          {card.responsibleName && <p>Responsável: {card.responsibleName}</p>}
                          {card.nextAction && <p>Próxima ação: {card.nextAction}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalVisibleCards > 0 && (
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
              {columns
                .filter((c) => c.cards.length > 0)
                .map((column, index) => (
                  <div
                    key={column.key}
                    title={`${column.label}: ${column.cards.length}`}
                    className={STAGE_BAR_COLORS[index % STAGE_BAR_COLORS.length]}
                    style={{ width: `${(column.cards.length / totalVisibleCards) * 100}%` }}
                  />
                ))}
            </div>
          )}
        </>
      )}
      </div>

      {activePipelineId && (
        <CrmCreateCardDialog
          open={createOpen}
          pipelineId={activePipelineId}
          onClose={() => setCreateOpen(false)}
          onCreated={(card) => {
            lastCreatedCardIdRef.current = card.id;
            activePipelineId && void load(activePipelineId);
          }}
        />
      )}

      <CrmCardDetailDialog
        open={Boolean(selectedCardId)}
        cardId={selectedCardId}
        pipeline={activePipeline}
        onClose={() => setSelectedCardId(null)}
        onChanged={() => activePipelineId && load(activePipelineId, true)}
      />

      <CrmPipelineManagerDialog
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onChanged={loadPipelines}
      />

      <CrmAutomationDialog open={automationOpen} onClose={() => setAutomationOpen(false)} />
    </div>
  );
}
