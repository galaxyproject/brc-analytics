import { type ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface UseAssistantHandoff {
  initialConfiguredInput: ConfiguredInput | undefined;
  isHandoff: boolean;
}
