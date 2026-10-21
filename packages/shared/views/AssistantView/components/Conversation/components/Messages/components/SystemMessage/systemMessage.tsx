import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { type JSX } from "react";
import { StyledTypography } from "./systemMessage.styles";
import type { SystemMessageProps } from "./types";

/**
 * Renders the app's own note, such as a field cleared from the setup panel, as
 * a plain centred line, so it doesn't read as something either side said.
 * @param props - Component props.
 * @param props.message - System message.
 * @returns The system message element.
 */
export const SystemMessage = ({ message }: SystemMessageProps): JSX.Element => {
  return (
    <StyledTypography
      color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
      component="div"
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
    >
      {message.content}
    </StyledTypography>
  );
};
