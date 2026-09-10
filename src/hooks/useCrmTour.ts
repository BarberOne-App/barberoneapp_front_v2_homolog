import { useContext } from "react";
import { CrmTourContext } from "@/context/CrmTourContext";

export function useCrmTour() {
  const context = useContext(CrmTourContext);
  if (!context) throw new Error("useCrmTour precisa ser usado dentro de CrmTourProvider.");
  return context;
}
