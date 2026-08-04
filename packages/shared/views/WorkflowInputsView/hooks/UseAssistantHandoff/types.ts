import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface UseAssistantHandoff {
  initialConfiguredInput: ConfiguredInput | undefined;
  isHandoff: boolean;
}
