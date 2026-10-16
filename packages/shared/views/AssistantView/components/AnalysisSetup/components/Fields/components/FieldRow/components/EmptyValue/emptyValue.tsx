import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { type JSX } from "react";
import { EMPTY_LABEL } from "./constants";
import { StyledTypography } from "./emptyValue.styles";
import type { EmptyValueProps } from "./types";

/**
 * Renders the placeholder for a field the assistant has not set: "Optional"
 * when the chosen workflow doesn't need it, otherwise "Not set".
 * @param props - Component props.
 * @param props.optional - Whether the field is optional for the chosen workflow.
 * @returns The empty value element.
 */
export const EmptyValue = ({
  optional = false,
}: EmptyValueProps): JSX.Element => {
  return (
    <StyledTypography
      color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
    >
      {optional ? EMPTY_LABEL.OPTIONAL : EMPTY_LABEL.NOT_SET}
    </StyledTypography>
  );
};
