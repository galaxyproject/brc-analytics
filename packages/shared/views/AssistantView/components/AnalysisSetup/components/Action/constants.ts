/**
 * Where the handoff sits in the setup panel: at its end on wider screens, and
 * at its start on narrow screens, where the setup is a tab of its own.
 */
export const ACTION_PLACEMENT = {
  END: "end",
  START: "start",
} as const;

/**
 * Label of the handoff to workflow setup, wherever it is offered.
 */
export const CONTINUE_LABEL = "Continue to workflow setup";
