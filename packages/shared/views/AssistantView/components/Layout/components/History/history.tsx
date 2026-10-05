import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack, Typography } from "@mui/material";
import { Headline } from "@repo/shared/views/AssistantView/components/Headline/headline";
import { type JSX } from "react";
import { StyledStack } from "./history.styles";
import type { Props } from "./types";

/**
 * Left column of the assistant layout: headline and new conversation at the
 * top, AI disclaimer and feedback at the bottom. On narrow screens the columns
 * simply stack, with this one above the chat.
 * @param props - History props.
 * @param props.disclaimer - AI disclaimer text.
 * @param props.feedbackButton - Feedback button.
 * @param props.newConversationButton - New conversation button.
 * @returns History column.
 */
export const History = ({
  disclaimer,
  feedbackButton,
  newConversationButton,
}: Props): JSX.Element => {
  return (
    <StyledStack useFlexGap>
      <Stack spacing={2} useFlexGap>
        <Headline />
        {newConversationButton}
      </Stack>
      <Stack spacing={2} useFlexGap>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400_2_LINES}
        >
          {disclaimer}
        </Typography>
        {feedbackButton}
      </Stack>
    </StyledStack>
  );
};
