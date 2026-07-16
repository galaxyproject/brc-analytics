import { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { PaperProps } from "@mui/material";
import { JSX } from "react";
import { StyledPaper } from "./fluidPaper.styles";

export const FluidPaper = (
  props: PaperProps & BaseComponentProps
): JSX.Element => {
  return <StyledPaper {...props} />;
};
