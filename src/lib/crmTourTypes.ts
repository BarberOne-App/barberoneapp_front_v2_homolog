export interface CrmTourControls {
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openManagerDialog: () => void;
  closeManagerDialog: () => void;
  openAutomationDialog: () => void;
  closeAutomationDialog: () => void;
  openCardDetail: (cardId?: string) => void;
  closeCardDetail: () => void;
  hasPipelines: () => boolean;
}

export type CrmTourRoute = "/crm" | "/crm-dashboard";

export interface CrmTourStepConfig {
  id: string;
  route: CrmTourRoute;
  selector: string;
  content: string;
  onEnter?: (controls: CrmTourControls | null) => void;
  onExit?: (controls: CrmTourControls | null) => void;
  // Pulado em runtime quando retorna true - usado pra passos que só fazem
  // sentido numa conta ainda sem pipeline (o "bootstrap" do primeiro
  // pipeline) ou só numa conta que já tem pipeline.
  skipIf?: (controls: CrmTourControls | null) => boolean;
  // true = passo só mostra algo, sem pedir nenhuma ação - "Próximo" libera na
  // hora. Por padrão (undefined/false) o passo exige um clique real dentro
  // do elemento destacado (selector) antes de liberar "Próximo".
  informational?: boolean;
}
