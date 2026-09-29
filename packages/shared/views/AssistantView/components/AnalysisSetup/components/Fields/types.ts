import type { AnalysisSetupProps } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

export type FieldsProps = Pick<
  AnalysisSetupProps,
  "loading" | "onSend" | "schema"
>;
