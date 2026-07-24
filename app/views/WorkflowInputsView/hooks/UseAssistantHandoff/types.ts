import { ConfiguredInput } from "../UseConfigureInputs/types";

export interface UseAssistantHandoff {
  initialConfiguredInput: ConfiguredInput | undefined;
  isHandoff: boolean;
}
