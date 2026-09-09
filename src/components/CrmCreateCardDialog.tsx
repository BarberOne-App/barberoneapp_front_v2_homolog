import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ClientPickerModal } from "@/components/ClientPickerModal";
import {
  REASON_LABELS,
  createCrmCard,
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

interface CrmCreateCardDialogProps {
  open: boolean;
  pipelineId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CrmCreateCardDialog({ open, pipelineId, onClose, onCreated }: CrmCreateCardDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [client, setClient] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState<CrmReason | "">("");
  const [responsibleUserId, setResponsibleUserId] = useState<string>("none");
  const [nextAction, setNextAction] = useState("");
  const [notes, setNotes] = useState("");
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setClient(null);
      setReason("");
      setResponsibleUserId("none");
      setNextAction("");
      setNotes("");
      return;
    }
    listUsers({ excludeRole: "client", limit: 100 })
      .then((r) => setStaff(r.items))
      .catch(() => null);
  }, [open]);

  async function handleSubmit() {
    if (!client || !reason) {
      toast.error("Selecione o cliente e o motivo.");
      return;
    }
    setSaving(true);
    try {
      await createCrmCard({
        clientId: client.id,
        pipelineId,
        primaryReason: reason,
        responsibleUserId: responsibleUserId === "none" ? null : responsibleUserId,
        nextAction: nextAction.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success("Card criado.");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Cliente</Label>
              {client ? (
                <div className="flex items-center justify-between rounded-md border border-border p-2">
                  <span className="text-sm font-medium">{client.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
                  Selecionar cliente
                </Button>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Motivo</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as CrmReason)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Responsável (opcional)</Label>
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
              <Label className="mb-2 block">Próxima ação (opcional)</Label>
              <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
            </div>

            <div>
              <Label className="mb-2 block">Notas (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                Criar card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClientPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(selected) => setClient(selected)}
        allowCreate
      />
    </>
  );
}
