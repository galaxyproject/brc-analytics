import { useContinueHandoff } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/hooks/UseContinueHandoff/hook";
import type { CompletionProps } from "@repo/shared/views/AssistantView/components/Conversation/components/Completion/types";
import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import { useSelectTab } from "@repo/shared/views/AssistantView/components/Layout/hooks/UseSelectTab/hook";
import { useCallback } from "react";
import type { UseCompletion } from "./types";

/**
 * Returns the handlers behind the completion block's buttons: continuing to
 * workflow setup, as the setup panel's own button does, and showing the setup
 * tab, where the layout moves focus too.
 * @param handoffUrl - Workflow setup URL, or null until the setup is complete.
 * @param schema - Current analysis schema.
 * @returns Continue and view-setup handlers.
 */
export const useCompletion = (
  handoffUrl: CompletionProps["handoffUrl"],
  schema: CompletionProps["schema"]
): UseCompletion => {
  const { onContinue } = useContinueHandoff(handoffUrl, schema);
  const onSelectTab = useSelectTab();

  const onViewSetup = useCallback((): void => {
    onSelectTab(LAYOUT_TAB.SETUP);
  }, [onSelectTab]);

  return { onContinue, onViewSetup };
};
