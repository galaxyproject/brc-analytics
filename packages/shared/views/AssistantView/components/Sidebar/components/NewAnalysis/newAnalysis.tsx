import { BUTTON_PRESETS } from "@databiosphere/findable-ui/lib/contracts/mui/Button/presets";
import { AddCircleRounded } from "@mui/icons-material";
import { type JSX } from "react";
import { StyledButton } from "./newAnalysis.styles";
import type { NewAnalysisProps } from "./types";

/**
 * Renders the action that starts a new conversation.
 * @param props - Component props.
 * @param props.disabled - Whether the chat is busy, so switching conversations is blocked.
 * @param props.onNewAnalysis - Starts a new conversation.
 * @returns The new analysis button element.
 */
export const NewAnalysis = ({
  disabled,
  onNewAnalysis,
}: NewAnalysisProps): JSX.Element => {
  return (
    <StyledButton
      {...BUTTON_PRESETS.PRIMARY_TEXT}
      disabled={disabled}
      onClick={onNewAnalysis}
      startIcon={<AddCircleRounded />}
    >
      New analysis
    </StyledButton>
  );
};
