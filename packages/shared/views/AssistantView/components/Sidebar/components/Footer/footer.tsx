import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { AddCommentRounded } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { type JSX } from "react";
import { StyledButton, StyledStack } from "./footer.styles";
import type { FooterProps } from "./types";

/**
 * Renders the AI disclaimer and, when the site has a feedback form, the
 * button that opens it.
 * @param props - Component props.
 * @param props.disclaimer - AI disclaimer text.
 * @param props.supportUrl - Feedback form URL; the button is hidden without one.
 * @returns The footer element.
 */
export const Footer = ({
  disclaimer,
  supportUrl,
}: FooterProps): JSX.Element => {
  return (
    <StyledStack>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400_2_LINES}
      >
        {disclaimer}
      </Typography>
      {supportUrl && (
        <StyledButton
          aria-label="Leave feedback on the Analysis Assistant (opens in a new tab)"
          color={BUTTON_PROPS.COLOR.SECONDARY}
          component="a"
          href={supportUrl}
          rel={REL_ATTRIBUTE.NO_OPENER_NO_REFERRER}
          startIcon={<AddCommentRounded />}
          target={ANCHOR_TARGET.BLANK}
          variant={BUTTON_PROPS.VARIANT.CONTAINED}
        >
          Leave feedback
        </StyledButton>
      )}
    </StyledStack>
  );
};
