import type { UseContinueHandoff } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/hooks/UseContinueHandoff/types";

export interface UseCompletion extends UseContinueHandoff {
  onViewSetup: () => void;
}
