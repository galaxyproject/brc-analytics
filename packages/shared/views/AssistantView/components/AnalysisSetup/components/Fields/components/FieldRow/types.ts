import type { SchemaFieldState } from "@repo/shared/services/api-client/types";
import type {
  AnalysisSetupProps,
  SchemaFieldKey,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

export interface FieldRowProps extends Pick<
  AnalysisSetupProps,
  "loading" | "onClearField"
> {
  field: SchemaFieldState;
  fieldKey: SchemaFieldKey;
}
