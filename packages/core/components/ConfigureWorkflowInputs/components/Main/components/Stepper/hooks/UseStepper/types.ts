export type OnContinue = () => void;

export type OnEdit = (step: number) => void;

export interface UseStepper {
  activeStep: number;
  onContinue: OnContinue;
  onEdit: OnEdit;
}
