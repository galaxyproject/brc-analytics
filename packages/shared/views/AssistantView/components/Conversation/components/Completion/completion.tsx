import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Button, Typography } from "@mui/material";
import { CONTINUE_LABEL } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/constants";
import { type JSX } from "react";
import { StyledGroup, StyledStack } from "./completion.styles";
import { HEADING, TEXT, VIEW_SETUP_LABEL } from "./constants";
import { useCompletion } from "./hooks/UseCompletion/hook";
import type { CompletionProps } from "./types";

/**
 * Once the analysis setup is complete, offers its next steps in the chat on
 * narrow screens, where the setup sits in another tab: continuing to workflow
 * setup, as the setup panel's own button does, or viewing the setup. Renders
 * nothing until the setup is complete, and is hidden on wider screens, where
 * the setup panel is alongside.
 * @param props - Component props.
 * @param props.disabled - Whether the assistant is busy replying or opening a conversation, when the handoff URL may be about to change.
 * @param props.handoffUrl - Workflow setup URL, or null until the setup is complete.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The completion element, or null while the setup is incomplete.
 */
export const Completion = ({
  disabled,
  handoffUrl,
  schema,
}: CompletionProps): JSX.Element | null => {
  const { onContinue, onViewSetup } = useCompletion(handoffUrl, schema);
  if (!handoffUrl) return null;
  return (
    <StyledStack>
      <StyledGroup>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
          component="h2"
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
        >
          {HEADING}
        </Typography>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          {TEXT}
        </Typography>
      </StyledGroup>
      <StyledGroup>
        <Button
          color={BUTTON_PROPS.COLOR.PRIMARY}
          disabled={disabled}
          fullWidth
          onClick={onContinue}
          variant={BUTTON_PROPS.VARIANT.CONTAINED}
        >
          {CONTINUE_LABEL}
        </Button>
        <Button
          color={BUTTON_PROPS.COLOR.SECONDARY}
          fullWidth
          onClick={onViewSetup}
          variant={BUTTON_PROPS.VARIANT.CONTAINED}
        >
          {VIEW_SETUP_LABEL}
        </Button>
      </StyledGroup>
    </StyledStack>
  );
};
