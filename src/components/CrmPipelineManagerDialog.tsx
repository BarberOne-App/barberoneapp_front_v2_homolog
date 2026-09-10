import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preventTourPanelDismiss } from "@/lib/preventTourPanelDismiss";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCrmPipeline,
  deleteCrmPipeline,
  listCrmPipelines,
  updateCrmPipeline,
  type CrmPipeline,
  type CrmStageDefinition,
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

interface CrmPipelineTemplate {
  key: string;
  name: string;
  description: string;
  stages: CrmStageDefinition[];
}

const CRM_PIPELINE_TEMPLATES: CrmPipelineTemplate[] = [
  {
    key: "padrao",
    name: "Padrão",
    description: "Fluxo genérico de recuperação, para qualquer motivo.",
    stages: [
      { key: "contato_pendente", label: "Contato pendente", sortOrder: 1, isTerminal: false, terminalOutcome: null },
      { key: "em_contato", label: "Em contato", sortOrder: 2, isTerminal: false, terminalOutcome: null },
      { key: "aguardando_cliente", label: "Aguardando cliente", sortOrder: 3, isTerminal: false, terminalOutcome: null },
      { key: "retorno_agendado", label: "Retorno agendado", sortOrder: 4, isTerminal: false, terminalOutcome: null },
      { key: "recuperado", label: "Recuperado", sortOrder: 5, isTerminal: true, terminalOutcome: "recuperado" },
      { key: "encerrado", label: "Encerrado", sortOrder: 6, isTerminal: true, terminalOutcome: "encerrado" },
    ],
  },
  {
    key: "pos_atendimento",
    name: "Pós-atendimento",
    description: "Fluxo genérico de pós-venda para qualquer serviço concluído — ideal para usar na automação automática.",
    stages: [
      { key: "contato_pendente", label: "Contato pendente", sortOrder: 1, isTerminal: false, terminalOutcome: null },
      { key: "em_contato", label: "Em contato", sortOrder: 2, isTerminal: false, terminalOutcome: null },
      { key: "retorno_agendado", label: "Retorno agendado", sortOrder: 3, isTerminal: false, terminalOutcome: null },
      { key: "recuperado", label: "Recuperado", sortOrder: 4, isTerminal: true, terminalOutcome: "recuperado" },
      { key: "encerrado", label: "Encerrado", sortOrder: 5, isTerminal: true, terminalOutcome: "encerrado" },
    ],
  },
  {
    key: "assinatura_vencida",
    name: "Assinatura vencida",
    description: "Acompanhamento de clientes com assinatura/plano vencido até a renovação.",
    stages: [
      { key: "contato_pendente", label: "Contato pendente", sortOrder: 1, isTerminal: false, terminalOutcome: null },
      { key: "negociando_renovacao", label: "Negociando renovação", sortOrder: 2, isTerminal: false, terminalOutcome: null },
      { key: "renovado", label: "Renovado", sortOrder: 3, isTerminal: true, terminalOutcome: "recuperado" },
      { key: "cancelado", label: "Cancelado", sortOrder: 4, isTerminal: true, terminalOutcome: "encerrado" },
    ],
  },
  {
    key: "avaliacao_baixa",
    name: "Avaliação baixa",
    description: "Tratativa de clientes que deixaram uma avaliação ruim.",
    stages: [
      { key: "contato_pendente", label: "Contato pendente", sortOrder: 1, isTerminal: false, terminalOutcome: null },
      { key: "em_tratativa", label: "Em tratativa", sortOrder: 2, isTerminal: false, terminalOutcome: null },
      { key: "resolvido", label: "Resolvido", sortOrder: 3, isTerminal: true, terminalOutcome: "recuperado" },
      { key: "sem_resposta", label: "Sem resposta", sortOrder: 4, isTerminal: true, terminalOutcome: "encerrado" },
    ],
  },
  {
    key: "em_branco",
    name: "Em branco",
    description: "Comece do zero, com apenas uma etapa inicial.",
    stages: [{ key: "etapa_1", label: "Nova etapa", sortOrder: 1, isTerminal: false, terminalOutcome: null }],
  },
];

function slugifyKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface CrmPipelineManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function CrmPipelineManagerDialog({ open, onClose, onChanged }: CrmPipelineManagerDialogProps) {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CrmPipeline | "new" | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<CrmStageDefinition[]>([]);
  const [saving, setSaving] = useState(false);

  function loadPipelines() {
    setLoading(true);
    listCrmPipelines()
      .then(setPipelines)
      .catch((err) => toast.error(getApiMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open) loadPipelines();
    else {
      setEditing(null);
      setShowTemplatePicker(false);
    }
  }, [open]);

  function startEditExisting(pipeline: CrmPipeline) {
    setName(pipeline.name);
    setIsDefault(pipeline.isDefault);
    setStages([...pipeline.stages].sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(pipeline);
  }

  function startEditFromTemplate(template: CrmPipelineTemplate) {
    setName(template.name);
    setIsDefault(pipelines.length === 0);
    setStages(template.stages.map((s) => ({ ...s })));
    setEditing("new");
    setShowTemplatePicker(false);
  }

  function addStage() {
    setStages((prev) => [
      ...prev,
      { key: "", label: "", sortOrder: prev.length + 1, isTerminal: false, terminalOutcome: null },
    ]);
  }

  function updateStage(index: number, patch: Partial<CrmStageDefinition>) {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sortOrder: i + 1 })));
  }

  function moveStage(index: number, direction: -1 | 1) {
    setStages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do pipeline.");
      return;
    }
    if (stages.length === 0) {
      toast.error("O pipeline precisa de pelo menos uma etapa.");
      return;
    }
    const normalizedStages = stages.map((s, i) => ({
      ...s,
      key: s.key.trim() || slugifyKey(s.label) || `etapa_${i + 1}`,
      label: s.label.trim() || `Etapa ${i + 1}`,
      sortOrder: i + 1,
    }));

    setSaving(true);
    try {
      if (editing === "new") {
        await createCrmPipeline({ name: name.trim(), isDefault, stages: normalizedStages });
        toast.success("Pipeline criado.");
      } else if (editing) {
        await updateCrmPipeline(editing.id, { name: name.trim(), isDefault, stages: normalizedStages });
        toast.success("Pipeline atualizado.");
      }
      setEditing(null);
      loadPipelines();
      onChanged();
    } catch (err) {
      toast.error(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pipeline: CrmPipeline) {
    if (!confirm(`Remover o pipeline "${pipeline.name}"?`)) return;
    try {
      await deleteCrmPipeline(pipeline.id);
      toast.success("Pipeline removido.");
      loadPipelines();
      onChanged();
    } catch (err) {
      toast.error(getApiMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-y-auto sm:max-w-2xl"
        onPointerDownOutside={preventTourPanelDismiss}
      >
        <DialogHeader>
          <DialogTitle>Pipelines do CRM</DialogTitle>
        </DialogHeader>

        {showTemplatePicker ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escolha o modelo mais parecido com o que você precisa — dá pra ajustar nome e etapas depois.
            </p>
            {CRM_PIPELINE_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => startEditFromTemplate(template)}
                className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-secondary/60"
              >
                <p className="font-medium text-foreground">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </button>
            ))}
            <Button type="button" variant="outline" onClick={() => setShowTemplatePicker(false)}>
              Voltar
            </Button>
          </div>
        ) : editing ? (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Nome do pipeline</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="isDefault" checked={isDefault} onCheckedChange={(v) => setIsDefault(Boolean(v))} />
              <Label htmlFor="isDefault">Pipeline padrão</Label>
            </div>

            <div>
              <Label className="mb-2 block">Etapas</Label>
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
                    <Input
                      className="w-40"
                      placeholder="Nome da etapa"
                      value={stage.label}
                      onChange={(e) => updateStage(index, { label: e.target.value })}
                    />
                    <div className="flex items-center gap-1 text-xs">
                      <Checkbox
                        id={`terminal-${index}`}
                        checked={stage.isTerminal}
                        onCheckedChange={(v) =>
                          updateStage(index, {
                            isTerminal: Boolean(v),
                            terminalOutcome: v ? stage.terminalOutcome ?? "recuperado" : null,
                          })
                        }
                      />
                      <Label htmlFor={`terminal-${index}`}>Etapa final</Label>
                    </div>
                    {stage.isTerminal && (
                      <Select
                        value={stage.terminalOutcome ?? "recuperado"}
                        onValueChange={(v) => updateStage(index, { terminalOutcome: v as "recuperado" | "encerrado" })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recuperado">Recuperado</SelectItem>
                          <SelectItem value="encerrado">Encerrado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveStage(index, -1)}>
                        <ArrowUp size={14} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveStage(index, 1)}>
                        <ArrowDown size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeStage(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addStage}>
                <Plus size={14} className="mr-2" />
                Adicionar etapa
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3" data-tour="pipeline-manager-list">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : pipelines.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhum pipeline criado ainda.</p>
            ) : (
              pipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {pipeline.name} {pipeline.isDefault && <span className="text-xs text-muted-foreground">(padrão)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{pipeline.stages.length} etapa(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEditExisting(pipeline)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(pipeline)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button
              type="button"
              data-tour="pipeline-manager-novo-btn"
              onClick={() => setShowTemplatePicker(true)}
            >
              <Plus size={14} className="mr-2" />
              Novo pipeline
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
