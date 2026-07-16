import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { JSX } from "react";
import { StyledFluidPaper } from "./emptyState.styles";
import { Props } from "./types";

/**
 * Empty-state paper for an organism detail section.
 * @param props - Component props.
 * @param props.children - Message text.
 * @returns Empty-state element.
 */
export const EmptyState = ({ children }: Props): JSX.Element => {
  return (
    <StyledFluidPaper>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
        {children}
      </Typography>
    </StyledFluidPaper>
  );
};
