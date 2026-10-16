import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { type JSX } from "react";
import type { UserMessageProps } from "./types";
import { StyledTypography } from "./userMessage.styles";

/**
 * Renders a message the user sent, as a right-aligned pill. Shown as typed,
 * line breaks included, rather than as markdown.
 * @param props - Component props.
 * @param props.message - User message.
 * @returns The user message element.
 */
export const UserMessage = ({ message }: UserMessageProps): JSX.Element => {
  return (
    <StyledTypography
      color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
      component="div"
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
    >
      {message.content}
    </StyledTypography>
  );
};
