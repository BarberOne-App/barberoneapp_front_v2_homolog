// Diálogos Radix fecham sozinhos ao detectar um pointerdown "fora" do
// conteúdo do diálogo - mas o painel do tour guiado (CrmTourStepPanel) é
// renderizado via portal direto no document.body, fora da árvore do
// diálogo, então clicar em "Próximo"/"Voltar" durante um passo do tour conta
// como clique de fora e fecha o diálogo no meio da explicação. Passar isso
// como onPointerDownOutside no DialogContent ignora especificamente cliques
// vindos do painel do tour, sem alterar o comportamento normal de
// clicar-fora-fecha pra qualquer outro clique.
export function preventTourPanelDismiss(event: { target: EventTarget | null; preventDefault: () => void }) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-crm-tour-panel]")) {
    event.preventDefault();
  }
}
