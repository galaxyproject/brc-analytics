import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { type JSX } from "react";
import { type GraphLoadingProps } from "./types";

/**
 * What the Graph tab shows while its code or its graph loads, or if its code
 * fails to load, as it can for a page left open across a deploy. Kept apart
 * from the Graph tab's code, which loads only when the tab opens.
 * @param props - Component props.
 * @param props.error - The error loading the tab's code, if it failed.
 * @returns The message.
 */
export const GraphLoading = ({ error }: GraphLoadingProps): JSX.Element => (
  <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
    {error
      ? "The graph couldn't be loaded. Please reload the page."
      : "Loading the graph…"}
  </Typography>
);
