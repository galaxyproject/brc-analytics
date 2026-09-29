import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { type JSX } from "react";
import { StyledButton } from "./action.styles";
import { useContinueHandoff } from "./hooks/UseContinueHandoff/hook";
import type { ActionProps } from "./types";

/**
 * Renders the handoff to workflow setup, disabled until the schema is complete
 * and while a reply is in flight, when the handoff URL may be about to change.
 * @param props - Component props.
 * @param props.handoffUrl - Workflow setup URL, or null until the schema is complete.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The continue button element.
 */
export const Action = ({
  handoffUrl,
  loading,
  schema,
}: ActionProps): JSX.Element => {
  const { onContinue } = useContinueHandoff(handoffUrl, schema);
  return (
    <StyledButton
      color={BUTTON_PROPS.COLOR.PRIMARY}
      disabled={!handoffUrl || loading}
      fullWidth
      onClick={onContinue}
      variant={BUTTON_PROPS.VARIANT.CONTAINED}
    >
      Continue to workflow setup
    </StyledButton>
  );
};
