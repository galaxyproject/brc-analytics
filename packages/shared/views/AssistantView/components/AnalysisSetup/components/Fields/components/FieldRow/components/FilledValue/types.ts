import type { FieldValueSelectorProps } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/selector/types";

export type FilledValueProps = Omit<FieldValueSelectorProps, "optional">;
