import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { AddCircleRounded } from "@mui/icons-material";
import { type JSX } from "react";
import { StyledButton } from "./newAnalysis.styles";
import type { NewAnalysisProps } from "./types";

/**
 * Renders the action that starts a new conversation.
 * @param props - Component props.
 * @param props.onNewAnalysis - Starts a new conversation.
 * @returns The new analysis button element.
 */
export const NewAnalysis = ({
  onNewAnalysis,
}: NewAnalysisProps): JSX.Element => {
  return (
    <StyledButton
      color={BUTTON_PROPS.COLOR.PRIMARY}
      onClick={onNewAnalysis}
      startIcon={<AddCircleRounded />}
      variant={BUTTON_PROPS.VARIANT.TEXT}
    >
      New analysis
    </StyledButton>
  );
};
