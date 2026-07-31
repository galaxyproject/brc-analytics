import { type BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { type PaperProps } from "@mui/material";
import { type JSX } from "react";
import { StyledPaper } from "./fluidPaper.styles";

export const FluidPaper = (
  props: PaperProps & BaseComponentProps
): JSX.Element => {
  return <StyledPaper {...props} />;
};
