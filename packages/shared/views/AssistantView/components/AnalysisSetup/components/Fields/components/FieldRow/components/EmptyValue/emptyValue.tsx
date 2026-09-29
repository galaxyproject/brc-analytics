import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { type JSX } from "react";
import { StyledTypography } from "./emptyValue.styles";

/**
 * Renders the placeholder for a field the assistant has not set.
 * @returns The empty value element.
 */
export const EmptyValue = (): JSX.Element => {
  return (
    <StyledTypography
      color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
    >
      Not set
    </StyledTypography>
  );
};
