import type { CrmTourStepConfig } from "./crmTourTypes";

// onEnter/onExit são sempre simétricos (cada abertura de diálogo tem seu
// fechamento em outro passo), pra o tour funcionar igual navegando pra
// frente ou pra trás.
export const crmTourSteps: CrmTourStepConfig[] = [
  {
    id: "kanban-intro",
    route: "/crm",
    selector: '[data-tour="kanban-board"]',
    content:
      "Bem-vindo ao CRM! Aqui você acompanha cada cliente que precisa de atenção — de quem cancelou até quem sumiu — organizados como um quadro de tarefas.",
  },
  {
    id: "kanban-novo-card-btn",
    route: "/crm",
    selector: '[data-tour="kanban-novo-card-btn"]',
    content:
      "Vamos criar seu primeiro card. Clique aqui sempre que quiser registrar um cliente que precisa de acompanhamento.",
  },
  {
    id: "create-dialog-cliente",
    route: "/crm",
    selector: '[data-tour="create-dialog-cliente-btn"]',
    content: "Primeiro, escolha o cliente — busque pelo nome ou telefone, ou cadastre um novo na hora.",
    onEnter: (controls) => controls?.openCreateDialog(),
  },
  {
    id: "create-dialog-motivo",
    route: "/crm",
    selector: '[data-tour="create-dialog-motivo-select"]',
    content: "Agora escolha o motivo, como 'Retorno atrasado' ou 'Avaliação baixa'.",
  },
  {
    id: "create-dialog-submit",
    route: "/crm",
    selector: '[data-tour="create-dialog-submit-btn"]',
    content: "Pronto! Clique aqui pra criar o card.",
  },
  {
    id: "kanban-card-created",
    route: "/crm",
    selector: '[data-tour="kanban-column-cards"]',
    content: "É assim que o card aparece no quadro — ele fica na primeira etapa até você fazer o próximo contato.",
    onEnter: (controls) => controls?.closeCreateDialog(),
  },
  {
    id: "card-detail-etapa",
    route: "/crm",
    selector: '[data-tour="card-detail-etapa-select"]',
    content: "Aqui você muda a etapa do cliente conforme ele avança, de 'Contato pendente' até 'Recuperado'.",
    onEnter: (controls) => controls?.openCardDetail(),
  },
  {
    id: "card-detail-contato",
    route: "/crm",
    selector: '[data-tour="card-detail-registrar-contato"]',
    content: "Toda vez que ligar ou mandar mensagem, registre aqui — escolha o canal e escreva o que aconteceu.",
  },
  {
    id: "card-detail-historico",
    route: "/crm",
    selector: '[data-tour="card-detail-historico"]',
    content: "Todo contato registrado fica salvo aqui, em ordem, pra você nunca perder o histórico com esse cliente.",
  },
  {
    id: "kanban-pipelines-btn",
    route: "/crm",
    selector: '[data-tour="kanban-pipelines-btn"]',
    content: "Esse ícone abre o gerenciador de pipelines — onde você organiza as etapas do seu funil.",
    onEnter: (controls) => controls?.closeCardDetail(),
  },
  {
    id: "pipeline-manager-list",
    route: "/crm",
    selector: '[data-tour="pipeline-manager-list"]',
    content: "Aqui estão seus pipelines. A maioria das barbearias usa só um, mas dá pra ter vários.",
    onEnter: (controls) => controls?.openManagerDialog(),
  },
  {
    id: "pipeline-manager-novo",
    route: "/crm",
    selector: '[data-tour="pipeline-manager-novo-btn"]',
    content: "Clique aqui pra criar um pipeline novo, com um modelo pronto ou do zero.",
    onExit: (controls) => controls?.closeManagerDialog(),
  },
  {
    id: "kanban-automacao-btn",
    route: "/crm",
    selector: '[data-tour="kanban-automacao-btn"]',
    content:
      "Esse ícone abre a automação: cria cards automaticamente depois de cada atendimento, sem você precisar lembrar.",
  },
  {
    id: "automation-switch",
    route: "/crm",
    selector: '[data-tour="automation-switch"]',
    content: "Ative esse botão pra ligar a automação de pós-atendimento.",
    onEnter: (controls) => controls?.openAutomationDialog(),
  },
  {
    id: "automation-pipeline",
    route: "/crm",
    selector: '[data-tour="automation-pipeline-select"]',
    content: "Escolha qual pipeline recebe os cards criados automaticamente.",
    onExit: (controls) => controls?.closeAutomationDialog(),
  },
  {
    id: "dashboard-funil",
    route: "/crm-dashboard",
    selector: '[data-tour="dashboard-funil"]',
    content: "Agora vamos ao Dashboard. Aqui está o funil: quantos clientes em cada etapa.",
  },
  {
    id: "dashboard-motivos",
    route: "/crm-dashboard",
    selector: '[data-tour="dashboard-motivos"]',
    content: "Os motivos mais comuns de cliente sumido ou cancelado.",
  },
  {
    id: "dashboard-evolucao",
    route: "/crm-dashboard",
    selector: '[data-tour="dashboard-evolucao"]',
    content: "E aqui, quantos clientes você recuperou x perdeu mês a mês.",
  },
  {
    id: "dashboard-atencao",
    route: "/crm-dashboard",
    selector: '[data-tour="dashboard-atencao"]',
    content:
      "Essa lista mostra quem precisa de atenção hoje. Esse é o CRM! Você pode assistir de novo clicando no ícone de ajuda.",
  },
];
