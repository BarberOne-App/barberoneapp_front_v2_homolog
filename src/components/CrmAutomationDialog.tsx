import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { preventTourPanelDismiss } from "@/lib/preventTourPanelDismiss";
import {
  getCrmAutomation,
  listCrmPipelines,
  saveCrmAutomation,
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

interface CrmAutomationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CrmAutomationDialog({ open, onClose }: CrmAutomationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [genericPipelineId, setGenericPipelineId] = useState<string>("none");
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getCrmAutomation(), listCrmPipelines()])
      .then(([automation, pipelinesData]) => {
        setEnabled(automation.enabled);
        setGenericPipelineId(automation.genericPipelineId ?? "none");
        setPipelines(pipelinesData);
      })
      .catch((err) => toast.error(getApiMessage(err)))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleSave() {
    if (enabled && genericPipelineId === "none") {
      toast.error("Selecione um pipeline padrão antes de ativar a automação.");
      return;
    }
    setSaving(true);
    try {
      await saveCrmAutomation({
        enabled,
        genericPipelineId: genericPipelineId === "none" ? null : genericPipelineId,
      });
      toast.success("Automação salva.");
      onClose();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={preventTourPanelDismiss}>
        <DialogHeader>
          <DialogTitle>Automação pós-atendimento</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quando ativado, ao concluir um atendimento o sistema cria automaticamente um card de
              acompanhamento pós-venda para o cliente, caso ele ainda não tenha um card ativo.
            </p>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="crm-automation-enabled">Ativar automação</Label>
                <p className="text-xs text-muted-foreground">
                  Cria card automaticamente ao finalizar um atendimento.
                </p>
              </div>
              <Switch
                id="crm-automation-enabled"
                data-tour="automation-switch"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div>
              <Label className="mb-2 block">Pipeline padrão</Label>
              <Select value={genericPipelineId} onValueChange={setGenericPipelineId}>
                <SelectTrigger className="w-full" data-tour="automation-pipeline-select">
                  <SelectValue placeholder="Selecione um pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Todo card criado automaticamente entra nesse pipeline, na primeira etapa não-final.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
