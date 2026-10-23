import type { FieldRowProps } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/types";

export interface FieldValueSelectorProps extends FieldRowProps {
  onKeyboardClear: () => void;
}
