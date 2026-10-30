import type { InputBaseProps } from "@mui/material";

export const ARIA_LABEL = {
  INPUT: "Message the assistant",
  SUBMIT: "Send message",
} as const;

export const INPUT_BASE_PROPS: InputBaseProps = {
  fullWidth: true,
  inputProps: { "aria-label": ARIA_LABEL.INPUT, autoComplete: "off" },
  maxRows: 4,
  multiline: true,
};

/**
 * Placeholder once the conversation has started.
 */
export const REPLY_PLACEHOLDER = "Reply...";
