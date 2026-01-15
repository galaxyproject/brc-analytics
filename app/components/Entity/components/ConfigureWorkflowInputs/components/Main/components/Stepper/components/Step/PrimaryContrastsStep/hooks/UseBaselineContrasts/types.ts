import { BaselineContrasts } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export type OnSelectBaseline = (value: string) => void;

export type OnToggleCompare = (value: string) => void;

export interface UseBaselineContrasts {
  baseline: string | null;
  compare: Set<string>;
  onSelectBaseline: OnSelectBaseline;
  onToggleCompare: OnToggleCompare;
  primaryContrasts: BaselineContrasts | null;
  valid: boolean;
}
