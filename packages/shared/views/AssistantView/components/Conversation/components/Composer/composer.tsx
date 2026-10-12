import { UpArrowIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/UpArrowIcon/upArrowIcon";
import { ICON_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/iconButton";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { IconButton } from "@mui/material";
import { type JSX } from "react";
import {
  StyledInputBase,
  StyledRoundedPaper,
  StyledStack,
} from "./composer.styles";
import { ARIA_LABEL, INPUT_BASE_PROPS } from "./constants";
import { useComposer } from "./hooks/UseComposer/hook";
import type { ComposerProps } from "./types";
import { getPlaceholder } from "./utils";

/**
 * Renders the field for writing to the assistant, in a card with its send
 * action beneath. Enter sends; Shift+Enter starts a new line. The field stays
 * enabled while the assistant is busy, so it keeps focus between turns; only
 * sending is blocked.
 * @param props - Component props.
 * @param props.disabled - Whether the assistant is busy, so nothing can be sent.
 * @param props.hasMessages - Whether the conversation has any messages.
 * @param props.onSend - Sends a message to the assistant.
 * @returns The composer element.
 */
export const Composer = ({
  disabled,
  hasMessages,
  onSend,
}: ComposerProps): JSX.Element => {
  const { canSend, inputRef, onChange, onKeyDown, onSubmit, value } =
    useComposer(onSend, disabled);
  return (
    <form onSubmit={onSubmit}>
      <StyledRoundedPaper elevation={0}>
        <StyledInputBase
          {...INPUT_BASE_PROPS}
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={getPlaceholder(hasMessages)}
          value={value}
        />
        <StyledStack direction={STACK_PROPS.DIRECTION.ROW}>
          <IconButton
            aria-label={ARIA_LABEL.SUBMIT}
            color={ICON_BUTTON_PROPS.COLOR.SECONDARY}
            disabled={!canSend}
            size={ICON_BUTTON_PROPS.SIZE.XSMALL}
            type="submit"
          >
            <UpArrowIcon fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL} />
          </IconButton>
        </StyledStack>
      </StyledRoundedPaper>
    </form>
  );
};
