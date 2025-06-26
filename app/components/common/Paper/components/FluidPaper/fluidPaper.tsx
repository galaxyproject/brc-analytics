import { PaperProps } from "@mui/material";
import { StyledPaper } from "./fluidPaper.styles";
import { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";

export const FluidPaper = (
  props: PaperProps & BaseComponentProps
): JSX.Element => {
  return <StyledPaper {...props} />;
};
