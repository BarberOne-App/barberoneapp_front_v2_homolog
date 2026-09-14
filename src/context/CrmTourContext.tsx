import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TourProvider as ReactourProvider, useTour } from "@reactour/tour";

import { CrmTourArrow } from "@/components/crm-tour/CrmTourArrow";
import { CrmTourStepPanel } from "@/components/crm-tour/CrmTourStepPanel";
import { crmTourSteps } from "@/lib/crmTourSteps";
import { waitForSelector } from "@/lib/waitForSelector";
import type { CrmTourControls } from "@/lib/crmTourTypes";

const HAS_SEEN_TOUR_KEY = "crm:hasSeenTour";

interface CrmTourContextValue {
  registerControls: (controls: CrmTourControls) => void;
  unregisterControls: () => void;
  startTour: () => void;
  hasSeenTour: boolean;
  isTourOpen: boolean;
}

export const CrmTourContext = createContext<CrmTourContextValue | null>(null);

// @reactour/tour só expõe setIsOpen/isOpen pra quem está DENTRO do
// <TourProvider> (via useTour()) - esse componente existe pra capturar isso
// e entregar pro provider de fora, via ref + callback. Não renderiza nada.
function TourOpenBridge({
  setIsOpenRef,
  onOpenChange,
}: {
  setIsOpenRef: React.MutableRefObject<((open: boolean) => void) | null>;
  onOpenChange: (open: boolean) => void;
}) {
  const { setIsOpen, isOpen } = useTour();
  useEffect(() => {
    setIsOpenRef.current = setIsOpen;
    return () => {
      setIsOpenRef.current = null;
    };
  }, [setIsOpen, setIsOpenRef]);

  useEffect(() => {
    onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  // Diálogos Radix (ex.: CrmCreateCardDialog) marcam todo mundo fora do modal
  // como aria-hidden="true" (via a lib "aria-hidden", que usa o marcador
  // data-aria-hidden pra saber o que ela mesma escondeu e poder restaurar
  // depois) - inclusive o popover do tour, que é um portal irmão, não filho
  // do modal. Isso não afeta a aparência, mas quem testa/navega via
  // acessibilidade (leitor de tela, e o próprio Playwright) trata esse
  // subtree como inexistente pra interação. Enquanto o tour estiver aberto,
  // desmarca especificamente o que essa lib marcou, sem mexer em nenhum
  // aria-hidden que o próprio app já usa de propósito.
  useEffect(() => {
    if (!isOpen) return;
    function unhide() {
      document.querySelectorAll("[data-aria-hidden]").forEach((el) => {
        el.removeAttribute("aria-hidden");
        el.removeAttribute("data-aria-hidden");
      });
    }
    unhide();
    const observer = new MutationObserver(unhide);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-hidden", "data-aria-hidden"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [isOpen]);

  return null;
}

export function CrmTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const controlsRef = useRef<CrmTourControls | null>(null);
  const setIsOpenRef = useRef<((open: boolean) => void) | null>(null);
  const runIdRef = useRef(0);

  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [stepActionDone, setStepActionDone] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    try {
      return localStorage.getItem(HAS_SEEN_TOUR_KEY) === "true";
    } catch {
      return false;
    }
  });

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(HAS_SEEN_TOUR_KEY, "true");
    } catch {
      /* ambiente sem localStorage (ex.: aba privada bloqueando) - segue sem persistir */
    }
    setHasSeenTour(true);
  }, []);

  const registerControls = useCallback((controls: CrmTourControls) => {
    controlsRef.current = controls;
  }, []);
  const unregisterControls = useCallback(() => {
    controlsRef.current = null;
  }, []);

  // Sai do passo atual (fecha diálogo se o passo pedir) e entra no alvo
  // (navega de rota se precisar, abre diálogo se o passo pedir), só então
  // espera o elemento existir de verdade no DOM antes de mover o spotlight.
  // Roda igual pra frente ou pra trás - onExit/onEnter são sempre simétricos.
  const goToStep = useCallback(
    async (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= crmTourSteps.length) return;
      // Nunca deixa uma segunda transição começar enquanto a anterior ainda
      // está esperando o elemento aparecer (navegação/diálogo tem latência
      // real) - sem isso, cliques rápidos ou rede lenta deixam o passo
      // anterior "órfão" (currentStep nunca chega a atualizar pra ele).
      if (isTransitioning) return;
      const runId = ++runIdRef.current;
      setIsTransitioning(true);

      try {
        crmTourSteps[currentStep]?.onExit?.(controlsRef.current);

        const step = crmTourSteps[targetIndex];
        if (location.pathname !== step.route) {
          navigate(step.route);
        }
        step.onEnter?.(controlsRef.current);

        const el = await waitForSelector(step.selector, { timeoutMs: 4000 });
        if (runId !== runIdRef.current) return; // outro goToStep começou antes deste terminar

        if (!el) {
          console.warn(`[crm-tour] selector not found for step "${step.id}": ${step.selector}`);
        } else {
          el.scrollIntoView({ block: "center", behavior: "instant" });
          // Diálogos abrem com animação (~200ms, zoom-in/fade do Tailwind).
          // waitForSelector resolve assim que o elemento entra no DOM, mas
          // isso é ANTES da animação terminar - o reactour mede a posição
          // pra desenhar o destaque assim que currentStep muda logo abaixo,
          // e se medir durante a animação, o destaque fica desenhado na
          // posição/tamanho errado (fixo depois, quando o diálogo já
          // terminou de animar, sem nunca remedir). Esperar a animação
          // assentar antes de trocar o passo evita isso.
          await new Promise((resolve) => setTimeout(resolve, 260));
          if (runId !== runIdRef.current) return;
        }
        setCurrentStep(targetIndex);
      } finally {
        if (runId === runIdRef.current) setIsTransitioning(false);
      }
    },
    [currentStep, isTransitioning, location.pathname, navigate],
  );

  const startTour = useCallback(() => {
    void goToStep(0).then(() => setIsOpenRef.current?.(true));
  }, [goToStep]);

  // Alguns passos só fazem sentido numa conta sem pipeline ainda (o
  // "bootstrap" do primeiro pipeline) ou só numa que já tem - resolveStepIndex
  // pula esses passos em runtime, pra frente ou pra trás, sem afetar contas
  // no estado oposto.
  const isStepSkipped = useCallback(
    (step: (typeof crmTourSteps)[number]) => step.skipIf?.(controlsRef.current) ?? false,
    [],
  );
  const resolveStepIndex = useCallback(
    (fromIndex: number, direction: 1 | -1) => {
      let idx = fromIndex;
      while (idx >= 0 && idx < crmTourSteps.length && isStepSkipped(crmTourSteps[idx])) {
        idx += direction;
      }
      return idx;
    },
    [isStepSkipped],
  );
  const visibleStepCount = useCallback(
    () => crmTourSteps.filter((s) => !isStepSkipped(s)).length,
    [isStepSkipped],
  );
  const visibleIndexOf = useCallback(
    (rawIndex: number) => crmTourSteps.slice(0, rawIndex).filter((s) => !isStepSkipped(s)).length,
    [isStepSkipped],
  );

  // "Próximo" só libera depois que o usuário realmente interage com o
  // elemento destacado do passo (não é só decorativo - sem isso dava pra
  // clicar Próximo repetidas vezes sem fazer nada, e o tour "andava" sem o
  // usuário aprender a ação de verdade). Passos informativos (sem ação
  // nenhuma pra fazer) liberam na hora.
  useEffect(() => {
    const step = crmTourSteps[currentStep];
    setStepActionDone(Boolean(step?.informational));
  }, [currentStep]);

  useEffect(() => {
    if (!isTourOpen) return;
    function handleClick(event: MouseEvent) {
      const step = crmTourSteps[currentStep];
      if (!step || step.informational) return;
      const target = event.target;
      if (target instanceof Element && target.closest(step.selector)) {
        setStepActionDone(true);
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isTourOpen, currentStep]);

  const reactourSteps = useMemo(
    () => crmTourSteps.map((step) => ({ selector: step.selector, content: step.content })),
    [],
  );

  const contextValue = useMemo<CrmTourContextValue>(
    () => ({ registerControls, unregisterControls, startTour, hasSeenTour, isTourOpen }),
    [registerControls, unregisterControls, startTour, hasSeenTour, isTourOpen],
  );

  return (
    <CrmTourContext.Provider value={contextValue}>
      {/* A máscara do reactour usa um <rect> com pointer-events:auto pra
          suportar "clicar fora fecha o tour" - não usamos isso (onClickMask
          é no-op de propósito), e esse rect às vezes intercepta cliques nos
          próprios botões do painel do tour quando há um diálogo real aberto
          por baixo. Como não precisamos de clique na máscara, desligar
          pointer-events nela resolve sem tocar em nada da biblioteca.
          O balão padrão do reactour (.reactour__popover) continua sendo
          criado pela própria biblioteca mesmo com ContentComponent custom -
          só que agora fica sem conteúdo nenhum, já que o CrmTourStepPanel
          renderiza tudo via portal direto no body. Sem isso, sobra uma
          caixinha vazia flutuando na tela, sem função. Não dá pra remover o
          nó do DOM (é interno da lib), mas visibility:hidden apaga ela por
          completo sem quebrar o cálculo de posição interno que a lib ainda
          faz em cima desse elemento. */}
      <style>{`
        .reactour__mask, .reactour__mask * { pointer-events: none !important; }
        .reactour__popover { visibility: hidden !important; pointer-events: none !important; }
      `}</style>
      <ReactourProvider
        steps={reactourSteps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        defaultOpen={false}
        showBadge={false}
        showCloseButton
        disableInteraction={false}
        onClickMask={() => {
          /* clicar fora do spotlight não fecha o tour, evita perder o lugar sem querer */
        }}
        ContentComponent={(props) => {
          const step = crmTourSteps[props.currentStep];
          return (
            <>
              {!isTransitioning && step && !step.informational && <CrmTourArrow selector={step.selector} />}
              <CrmTourStepPanel
                currentStep={visibleIndexOf(props.currentStep)}
                totalSteps={visibleStepCount()}
                content={String(props.steps[props.currentStep]?.content ?? "")}
                disabled={isTransitioning}
                nextDisabled={!stepActionDone}
                onNext={() => void goToStep(resolveStepIndex(props.currentStep + 1, 1))}
                onPrev={() => void goToStep(resolveStepIndex(props.currentStep - 1, -1))}
                onSkipOrFinish={() => {
                  props.setIsOpen(false);
                  markSeen();
                }}
              />
            </>
          );
        }}
      >
        <TourOpenBridge setIsOpenRef={setIsOpenRef} onOpenChange={setIsTourOpen} />
        {children}
      </ReactourProvider>
    </CrmTourContext.Provider>
  );
}
