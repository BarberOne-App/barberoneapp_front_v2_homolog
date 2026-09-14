import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Props {
  selector: string;
}

interface ArrowPosition {
  top: number;
  left: number;
  direction: "down" | "up";
}

// Recalcula a posição a cada frame (em vez de só em resize/scroll) porque o
// alvo pode estar animando (diálogo abrindo) ou dentro de um diálogo que
// ainda não existia no frame anterior - um rAF loop cobre os dois casos sem
// precisar de um observer por caso.
export function CrmTourArrow({ selector }: Props) {
  const [position, setPosition] = useState<ArrowPosition | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    function measure() {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) {
        setPosition((prev) => (prev === null ? prev : null));
      } else {
        const rect = el.getBoundingClientRect();
        const direction: "down" | "up" = rect.top > 96 ? "down" : "up";
        const top = direction === "down" ? rect.top - 40 : rect.bottom + 8;
        const left = rect.left + rect.width / 2;
        setPosition({ top, left, direction });
      }
      frameRef.current = requestAnimationFrame(measure);
    }
    frameRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameRef.current);
  }, [selector]);

  if (!position) return null;

  const Icon = position.direction === "down" ? ArrowDown : ArrowUp;

  return createPortal(
    // A centralização horizontal (-translate-x-1/2) fica no wrapper externo,
    // sem animação - "animate-bounce" também anima a propriedade transform,
    // e as duas juntas no mesmo elemento fazem uma sobrescrever a outra
    // (a centralização já quebrou por causa disso quando estavam no mesmo nó).
    <div
      className="pointer-events-none fixed z-[2147483646] -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
    >
      <div className="animate-bounce text-primary" style={{ filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.6))" }}>
        <Icon size={32} strokeWidth={3} />
      </div>
    </div>,
    document.body,
  );
}
