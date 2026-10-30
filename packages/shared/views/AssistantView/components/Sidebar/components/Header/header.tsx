import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { type JSX } from "react";
import { StyledBeta, StyledStack } from "./header.styles";

/**
 * Renders the assistant title with its Beta chip.
 * @returns The header element.
 */
export const Header = (): JSX.Element => {
  return (
    <StyledStack direction={STACK_PROPS.DIRECTION.ROW}>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
        component="h1"
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}
      >
        Analysis assistant
      </Typography>
      <StyledBeta color={CHIP_PROPS.COLOR.INFO} />
    </StyledStack>
  );
};
