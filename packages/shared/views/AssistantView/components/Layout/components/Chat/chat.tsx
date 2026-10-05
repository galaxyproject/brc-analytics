import { Stack } from "@mui/material";
import { type JSX } from "react";
import { StyledStack } from "./chat.styles";
import type { Props } from "./types";

/**
 * Middle column of the assistant layout, centring the chat at a readable width.
 * @param props - Chat props.
 * @param props.children - Chat panel.
 * @returns Chat column.
 */
export const Chat = ({ children }: Props): JSX.Element => {
  return (
    <StyledStack>
      <Stack>{children}</Stack>
    </StyledStack>
  );
};
