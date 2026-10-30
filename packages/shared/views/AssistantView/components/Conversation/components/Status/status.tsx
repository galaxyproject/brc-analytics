import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { type JSX } from "react";
import type { StatusProps } from "./types";

/**
 * Renders a spinner with a short note of what the assistant is doing. The
 * spinner is hidden from screen readers; the note says it.
 * @param props - Component props.
 * @param props.label - What the assistant is doing.
 * @returns The status element.
 */
export const Status = ({ label }: StatusProps): JSX.Element => {
  return (
    <Stack
      alignItems={STACK_PROPS.ALIGN_ITEMS.CENTER}
      direction={STACK_PROPS.DIRECTION.ROW}
      gap={2}
    >
      <CircularProgress aria-hidden size={20} />
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
      >
        {label}
      </Typography>
    </Stack>
  );
};
