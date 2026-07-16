import { Stack } from "@mui/material";
import { JSX } from "react";
import { Props } from "./types";

/**
 * Renders a key-value element type for the KeyValuePairs component.
 * @param props - Props.
 * @param props.keyValue - Key-value pair.
 * @returns Key-value element type.
 */
export const KeyValueElType = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Unused prop passed by KeyValuePairs
  keyValue,
  ...props
}: Props): JSX.Element => {
  return <Stack useFlexGap {...props} />;
};
