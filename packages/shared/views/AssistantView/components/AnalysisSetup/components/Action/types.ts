import type { AnalysisSetupProps } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

export type ActionProps = Pick<
  AnalysisSetupProps,
  "handoffUrl" | "loading" | "schema"
>;
