import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import { Filter, Kanban as KanbanIcon, Loader2, Plus, Search, Settings, Star } from "lucide-react";

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
import { CrmCardDetailDialog } from "@/components/CrmCardDetailDialog";
import { CrmCreateCardDialog } from "@/components/CrmCreateCardDialog";
import { CrmPipelineManagerDialog } from "@/components/CrmPipelineManagerDialog";
import {
  listCrmCards,
  listCrmPipelines,
  reasonLabel,
  updateCrmCard,
  type CrmCard,
  type CrmPipeline,
} from "@/service/crmService";
import { listUsers, type UserProfile } from "@/service/userService";

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
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [staff, setStaff] = useState<UserProfile[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const dragStateRef = useRef<DragState | null>(null);

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

  const responsibleOptions = useMemo(() => {
    const map = new Map<string, string>();
    staff.forEach((s) => map.set(s.id, s.name));
    return Array.from(map.entries());
  }, [staff]);

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
    if (sortBy === "days") {
      list = [...list].sort(
        (a, b) => (b.stats.daysSinceLastVisit ?? -1) - (a.stats.daysSinceLastVisit ?? -1)
      );
    } else if (sortBy === "ticket") {
      list = [...list].sort((a, b) => (b.stats.averageTicket ?? 0) - (a.stats.averageTicket ?? 0));
    }
    return list;
  }, [cards, search, responsibleFilter, sortBy]);

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

          <Button variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
            <Settings size={14} className="mr-2" />
            Pipelines
          </Button>

          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!activePipelineId}>
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
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <div
              key={column.key}
              data-crm-column={column.key}
              className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/30 p-2 transition-all"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-foreground">{column.label}</span>
                <Badge variant="outline">{column.cards.length}</Badge>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
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
                      <p className="truncate font-medium text-foreground">{card.clientName}</p>
                      {card.clientPhone && (
                        <p className="text-xs text-muted-foreground">{card.clientPhone}</p>
                      )}
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
                      <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                        {card.stats.favoriteService && <p>Serviço favorito: {card.stats.favoriteService}</p>}
                        {card.stats.daysSinceLastVisit !== null && (
                          <p>{card.stats.daysSinceLastVisit} dia(s) sem retornar</p>
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
      )}

      {activePipelineId && (
        <CrmCreateCardDialog
          open={createOpen}
          pipelineId={activePipelineId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => activePipelineId && load(activePipelineId)}
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
    </div>
  );
}
