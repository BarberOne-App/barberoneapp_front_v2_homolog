export interface CrmTourControls {
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openManagerDialog: () => void;
  closeManagerDialog: () => void;
  openAutomationDialog: () => void;
  closeAutomationDialog: () => void;
  openCardDetail: (cardId?: string) => void;
  closeCardDetail: () => void;
}

export type CrmTourRoute = "/crm" | "/crm-dashboard";

export interface CrmTourStepConfig {
  id: string;
  route: CrmTourRoute;
  selector: string;
  content: string;
  onEnter?: (controls: CrmTourControls | null) => void;
  onExit?: (controls: CrmTourControls | null) => void;
}
