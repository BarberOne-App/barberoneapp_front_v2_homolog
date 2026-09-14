import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { preventTourPanelDismiss } from "@/lib/preventTourPanelDismiss";
import {
  CONTACT_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  REASON_LABELS,
  addCrmTrigger,
  createCrmEvent,
  deleteCrmCard,
  getCrmCard,
  listCrmEvents,
  reasonLabel,
  setCrmTriggerPrimary,
  stageLabel,
  updateCrmCard,
  type CrmCard,
  type CrmEvent,
  type CrmPipeline,
  type CrmReason,
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

interface CrmCardDetailDialogProps {
  open: boolean;
  cardId: string | null;
  pipeline: CrmPipeline | null;
  onClose: () => void;
  onChanged: () => void;
}

export function CrmCardDetailDialog({
  open,
  cardId,
  pipeline,
  onClose,
  onChanged,
}: CrmCardDetailDialogProps) {
  const { user } = useAuth();
  const [card, setCard] = useState<CrmCard | null>(null);
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState<string>("none");
  const [nextAction, setNextAction] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [notes, setNotes] = useState("");

  const [newReason, setNewReason] = useState<CrmReason | "">("");
  const [contactType, setContactType] = useState<string>("whatsapp");
  const [contactOutcome, setContactOutcome] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open || !cardId) return;
    setLoading(true);
    setError(null);
    Promise.all([getCrmCard(cardId), listCrmEvents(cardId), listUsers({ excludeRole: "client", limit: 100 })])
      .then(([cardData, eventsData, staffData]) => {
        setCard(cardData);
        setEvents(eventsData);
        setStaff(staffData.items);
        setStage(cardData.stage);
        setResponsibleUserId(cardData.responsibleUserId ?? "none");
        setNextAction(cardData.nextAction ?? "");
        setNextActionAt(cardData.nextActionAt ? cardData.nextActionAt.slice(0, 16) : "");
        setNotes(cardData.notes ?? "");
      })
      .catch((err) => setError(getApiMessage(err)))
      .finally(() => setLoading(false));
  }, [open, cardId]);

  useEffect(() => {
    if (!open) {
      setCard(null);
      setEvents([]);
      setNewReason("");
      setContactOutcome("");
      setContactNotes("");
      setConfirmDelete(false);
    }
  }, [open]);

  async function refresh() {
    if (!cardId) return;
    const [cardData, eventsData] = await Promise.all([getCrmCard(cardId), listCrmEvents(cardId)]);
    setCard(cardData);
    setEvents(eventsData);
  }

  async function handleSave() {
    if (!cardId) return;
    setSaving(true);
    try {
      await updateCrmCard(cardId, {
        stage,
        responsibleUserId: responsibleUserId === "none" ? null : responsibleUserId,
        nextAction: nextAction.trim() || null,
        nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
        notes: notes.trim() || null,
      });
      toast.success("Card atualizado.");
      await refresh();
      onChanged();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddReason() {
    if (!cardId || !newReason) return;
    try {
      await addCrmTrigger(cardId, { reason: newReason });
      setNewReason("");
      await refresh();
      onChanged();
    } catch (err) {
      toast.error(getApiMessage(err));
    }
  }

  async function handleSetPrimary(triggerId: string) {
    if (!cardId) return;
    try {
      await setCrmTriggerPrimary(cardId, triggerId);
      await refresh();
      onChanged();
    } catch (err) {
      toast.error(getApiMessage(err));
    }
  }

  async function handleRegisterContact() {
    if (!cardId) return;
    if (!contactType && !contactNotes.trim()) {
      toast.error("Informe o tipo de contato ou uma observação.");
      return;
    }
    try {
      await createCrmEvent(cardId, {
        contactType: contactType || undefined,
        outcome: contactOutcome.trim() || undefined,
        notes: contactNotes.trim() || undefined,
      });
      setContactOutcome("");
      setContactNotes("");
      toast.success("Contato registrado.");
      await refresh();
      onChanged();
    } catch (err) {
      toast.error(getApiMessage(err));
    }
  }

  async function handleDelete() {
    if (!cardId) return;
    try {
      await deleteCrmCard(cardId);
      toast.success("Card excluído.");
      setConfirmDelete(false);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(getApiMessage(err));
      setConfirmDelete(false);
    }
  }

  const canDelete = Boolean(
    card && user && (user.isAdmin || user.role === "admin" || user.role === "super_admin" || card.createdBy === user.id)
  );

  const availableReasons = Object.keys(REASON_LABELS).filter(
    (r) => !card?.triggers.some((t) => t.reason === r)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent
          className="flex max-h-[90vh] flex-col overflow-y-auto sm:max-w-2xl"
          onPointerDownOutside={preventTourPanelDismiss}
        >
          <DialogHeader>
            <DialogTitle>{card?.clientName ?? "Card do CRM"}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : card ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Etapa</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger className="w-full" data-tour="card-detail-etapa-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...(pipeline?.stages ?? [])]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.label}
                            {s.isTerminal ? " (etapa final)" : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Responsável</Label>
                  <Select value={responsibleUserId} onValueChange={setResponsibleUserId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem responsável</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Próxima ação</Label>
                  <Input
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="Ex.: ligar oferecendo desconto"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Data/hora da próxima ação</Label>
                  <Input
                    type="datetime-local"
                    value={nextActionAt}
                    onChange={(e) => setNextActionAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                {canDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Excluir
                  </Button>
                )}
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <Label className="mb-2 block">Motivos</Label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {card.triggers.map((t) => (
                    <Badge
                      key={t.id}
                      variant={t.isPrimary ? "default" : "outline"}
                      className="flex items-center gap-1"
                    >
                      {t.isPrimary && <Star size={11} />}
                      {reasonLabel(t.reason)}
                      {!t.isPrimary && (
                        <button
                          type="button"
                          className="ml-1 underline"
                          onClick={() => handleSetPrimary(t.id)}
                        >
                          tornar principal
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {availableReasons.length > 0 && (
                  <div className="flex gap-2">
                    <Select value={newReason} onValueChange={(v) => setNewReason(v as CrmReason)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Adicionar motivo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableReasons.map((r) => (
                          <SelectItem key={r} value={r}>
                            {REASON_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={handleAddReason} disabled={!newReason}>
                      Adicionar
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4" data-tour="card-detail-registrar-contato">
                <Label className="mb-2 block">Registrar contato</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Select value={contactType} onValueChange={setContactType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="sm:col-span-2"
                    placeholder="Resultado do contato"
                    value={contactOutcome}
                    onChange={(e) => setContactOutcome(e.target.value)}
                  />
                </div>
                <Textarea
                  className="mt-2"
                  placeholder="Observações (opcional)"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  rows={2}
                />
                <Button type="button" size="sm" className="mt-2" onClick={handleRegisterContact}>
                  Registrar contato
                </Button>
              </div>

              <div className="border-t border-border pt-4" data-tour="card-detail-historico">
                <Label className="mb-2 block">Histórico</Label>
                <div className="max-h-52 space-y-2 overflow-y-auto text-sm">
                  {events.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum evento registrado ainda.</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="rounded-md border border-border p-2">
                        <p className="font-medium text-foreground">
                          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                        </p>
                        {event.fromStage && event.toStage && (
                          <p className="mt-1 text-muted-foreground">
                            {stageLabel(event.fromStage, pipeline?.stages)} → {stageLabel(event.toStage, pipeline?.stages)}
                          </p>
                        )}
                        {event.contactType && (
                          <p className="mt-1 text-muted-foreground">
                            Canal: {CONTACT_TYPE_LABELS[event.contactType] ?? event.contactType}
                          </p>
                        )}
                        {event.outcome && <p className="mt-1 text-muted-foreground">{event.outcome}</p>}
                        {event.notes && <p className="mt-1 text-muted-foreground">{event.notes}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir card?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O histórico e os motivos deste card serão apagados junto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
