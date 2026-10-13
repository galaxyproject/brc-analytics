import type { AnalysisSetupProps } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";
import type { ACTION_PLACEMENT } from "./constants";

/**
 * Where the handoff sits in the setup panel.
 */
export type ActionPlacement =
  (typeof ACTION_PLACEMENT)[keyof typeof ACTION_PLACEMENT];

export interface ActionProps extends Pick<
  AnalysisSetupProps,
  "handoffUrl" | "loading" | "schema"
> {
  placement: ActionPlacement;
}

export type StyledButtonProps = Pick<ActionProps, "placement">;
