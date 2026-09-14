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
  // hora, sem avanço automático (senão o usuário nunca teria tempo de ler).
  informational?: boolean;
  // Como detectar que a ação do passo foi concluída (passos não
  // informational exigem uma dessas antes de liberar/avançar):
  // - "click" (padrão): um clique real dentro do elemento destacado.
  // - "disappear": o elemento destacado some do DOM (botão vira outra coisa
  //   quando a escolha é feita, ex.: "Selecionar cliente" vira o card do
  //   cliente escolhido; diálogo fecha depois de criar com sucesso). Clicar
  //   sem completar a ação de verdade (ex.: dialog continua aberto por causa
  //   de erro de validação) não conta.
  // - "change": o conteúdo do próprio elemento muda (ex.: um <Select> que
  //   troca o texto exibido quando uma opção é escolhida) - clicar só pra
  //   abrir o dropdown não conta.
  completion?: "click" | "disappear" | "change";
}
